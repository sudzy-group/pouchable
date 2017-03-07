/**
 * Base class for entity, which is the building block of the data structure.
 * Each entity holds one main coreument representing an instance of the entity
 * and sub coreuments that hold metadata and search terms for this entity.
 */
import * as PouchDB from 'pouchdb';
import { map, assign, omitBy, isNil, findIndex, pullAllBy, filter } from 'lodash';
import { EntityCollection } from './EntityCollection'

/**
 * Base class of entity, should not be used directly
 */
export class EntityBase {

    /**
     * @var the collection
     */
    protected _collection : EntityCollection;

    /**
     * Unique id for this entity
     */
    protected _id : string;

    /**
     * @var the main doc of this entity
     */
    public core;

    /**
     * @var the decorator objects
     */
    public decorators : any[];

    /**
     * @var the search keys objects
     */
    public search_keys_ref : any[];

    constructor(collection: EntityCollection, id : string, core: any, decorators?: any[], search_keys_ref?: any[]) {
        if (!core) {
            throw new TypeError("Missing type or db");
        }

        this._collection = collection;
        this._id = id;
        this.core = core;
        this.decorators = decorators || [] ;
        this.search_keys_ref = search_keys_ref || [];
    }

    addDecorator(store: string, decorator: any) {
        if (!store || !decorator) {
            throw new Error("unable to add store-less, empty decorator");
        }

        let index = findIndex(this.decorators, {store : store});
        if (index != -1) {
            throw new Error("unable to add existing decorator. (" + store + ")");
        }

        decorator._id = this._collection.prefix + this._id + '/' + store;
        decorator._added = true;
        decorator.store = store;
        this.decorators.push(decorator);

        return this;
    }

    updateDecorator(store: string, decorator: any) {
        if (!store || !decorator) {
            throw new Error("unable to add store-less, empty decorator");
        }
        let index = findIndex(this.decorators, {store : store});
        if (index == -1) {
            throw new Error("unable to update missing decorator, use add instead (" + store + ")");
        }
        assign(this.decorators[index], decorator);
        omitBy(this.decorators[index], isNil);

        // if recently added just do the add, otherwise mark for update
        if (!this.decorators[index]._added) {
            this.decorators[index]._updated = true;
        }
        return this;
    }

    addSearchKey(key, value) {
        var sk_id = this._collection.prefix + this._id + '/sk/' + value
        let index = findIndex(this.search_keys_ref, { _id: sk_id });
        if (index != -1) {
            if (this.search_keys_ref[index]._deleted) {
                delete this.search_keys_ref[index]._deleted;
            } 
            return; 
        }

        let ref = this._collection.prefix + value + '/' + this._id;
        this.search_keys_ref.push({
            _id: this._collection.prefix + this._id + '/sk/' + value,
            key: key,
            ref: ref,
            _added: true
        })
        return this;
    }

    removeSearchKey(value) {
        let id = this._collection.prefix + this._id + '/sk/' + value;
        let index = findIndex(this.search_keys_ref, { _id: id });
        if (index == -1) {
            throw new Error("missing key");
        }
        if (this.search_keys_ref[index]._added) {
            this.search_keys_ref.splice(index, 1);
        } else {
            this.search_keys_ref[index]._deleted = true;
        }

        return this;
    }

    /**
     * Persist the operations into the database 
     */
    save() : Promise {

        let t = this;
        let decorators = this.decorators;
        let collection = this._collection;
        let search_keys_ref = this.search_keys_ref;

        return new Promise((resolved, rejected) => {

            let ps = [];
            for (let decorator of decorators) {
                if (decorator._added || decorator._updated || decorator._deleted) {
                    delete decorator._added;
                    delete decorator._updated;
                    ps.push(collection.getDb().put(decorator));
                }
            }
            pullAllBy(decorators, { _deleted : true }, '_deleted');

            let fetch = [];
            for (let sk_ref of search_keys_ref) {
                if (sk_ref._added) {
                    delete sk_ref._added;
                    ps.push(collection.getDb().put({ _id: sk_ref.ref }))
                    ps.push(collection.getDb().put(sk_ref));

                }
                if (sk_ref._deleted) {
                    fetch.push(collection.getDb().get(sk_ref.ref));
                    ps.push(collection.getDb().put(sk_ref));
                }
            }

            pullAllBy(search_keys_ref, { _deleted : true }, '_deleted');

            if (fetch.length == 0) {
                return Promise.all(ps).then((ds) => {
                    t.resolveRevs(ds);
                    return resolved(t)
                }).catch((m) => {
                    rejected(m);
                }) ;
            }

            Promise.all(fetch).then((sks) => {
                for (let sk of sks) {
                    sk._deleted = true;
                    ps.push(collection.getDb().put(sk))
                }
                return Promise.all(ps);
            }).then((ds) => {
                t.resolveRevs(ds);
                return resolved(t);
            }).catch((m) => {
                return rejected(m);
            })
        });
    }

    /**
     * Rollback operations to model
     */
    rollback() {
        let t = this;
        return new Promise((resolved, rejected) => {

            // remove the new nodes
            pullAllBy(t.decorators, [{ rev : undefined }], 'rev');
            pullAllBy(t.search_keys_ref, [{ rev : undefined }], 'rev');

            // revert the deleted search keys
            let dsks = filter(t.search_keys_ref, (d) => d._deleted);
            for (let sk of dsks) {
                delete sk._deleted ;
            }
 
            // refresh the decorators that were updated
            let dds = filter(t.decorators, (d) => (d._updated));
            let ids = map(dds, '_id');
            let ps = [];
            for (let id of ids) {
                ps.push(t._collection.getDb().get(id));
            }

            if (ps.length == 0) {
                resolved(t);
            }

            Promise.all(ps).then((ds) => {
                for(let d of ds) {
                    let index = findIndex(t.decorators, d.id);
                    t.decorators[index] = d.doc;
                }
                return resolved(t);               
            }).catch((m) => {
                rejected(m)
            });
        });        
    }


    resolveRevs(ds) {
        let index = findIndex(ds, { id: this.core._id });
        if (index != -1) {
            this.core._rev = ds[index].rev;
        }
        
        for (let d of this.decorators) {
            let index = findIndex(ds, { id: d._id });
            if (index != -1) {
                d._rev = ds[index].rev;
            }
        }

        for (let sk_ref of this.search_keys_ref) {
            let index = findIndex(ds, { id: sk_ref._id });
            if (index != -1) {
                sk_ref._rev = ds[index].rev;   
            }
        }
    }

}
