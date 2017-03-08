/**
 * Base class for entity, which is the building block of the data structure.
 * Each entity holds one main coreument representing an instance of the entity
 * and sub coreuments that hold metadata and search terms for this entity.
 */
import * as PouchDB from 'pouchdb';
import { map, assign, omitBy, isNil, findIndex, pullAllBy, filter, forIn, unset, values, forInRight } from 'lodash';
import { EntityCollectionBase } from './EntityCollectionBase'

/**
 * Base class of entity, should not be used directly
 */
export class EntityBase {

    /**
     * @var the collection
     */
    protected _collection : EntityCollectionBase;

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
    public decorators = {};

    /**
     * @var the search keys objects
     */
    public search_keys_ref = {};

    constructor(collection: EntityCollectionBase, id : string, core: any, decorators?, search_keys_ref?) {
        if (!core) {
            throw new TypeError("Missing type or db");
        }

        this._collection = collection;
        this._id = id;
        this.core = core;
        if (decorators) {
            this.decorators = decorators;
        }
        if (search_keys_ref) {
            this.search_keys_ref = search_keys_ref
        }
    }

    /**
     * Returns the id
     */
    public getId() {
        return this._id;
    }

    addDecorator(store: string, decorator: any) {
        if (!store || !decorator || store.length == 0) {
            throw new Error("unable to add store-less, empty decorator");
        }

        var d = this.decorators[store];
        if (d) {
            throw new Error("unable to add existing decorator. (" + store + ")");
        }

        decorator._id = this._collection.prefix + this._id + '/' + store;
        decorator._added = true;
        decorator.store = store;
        this.decorators[store] = decorator;

        return this;
    }

    updateDecorator(store: string, decorator: any) {
        if (!store || !decorator) {
            throw new Error("unable to add store-less, empty decorator");
        }
        
        var d = this.decorators[store];
        if (!d) {
            throw new Error("updable to update missing decorator");
        }

        assign(d, decorator);
        omitBy(d, isNil);

        // if recently added just do the add, otherwise mark for update
        if (!d._added) {
            d._updated = true;
        }
        return this;
    }

    addSearchKey(key, value) {
        var sk_id = this._collection.prefix + this._id + '/sk/' + value
        var sk = this.search_keys_ref[value];
        if (sk) {
            if (sk._deleted) {
                delete sk._deleted;
            } 
            return; 
        }

        let ref = this._collection.prefix + value + '/' + this._id;
        this.search_keys_ref[value] = {
            _id: this._collection.prefix + this._id + '/sk/' + value,
            key: key,
            ref: ref,
            _added: true
        };
        return this;
    }

    removeSearchKey(key) {

        forInRight(this.search_keys_ref, (sk, value) => {
            if (sk.key == key) {
                if (sk._added) {
                    unset(this.search_keys_ref, value)
                } else {
                    sk._deleted = true;
                }
            }
        });

        return this;
    }

    /**
     * Persist the operations into the database 
     */
    save() : Promise<EntityBase> {

        let t = this;
        let decorators = this.decorators;
        let collection = this._collection;
        let search_keys_ref = this.search_keys_ref;

        return new Promise((resolved, rejected) => {

            let ps = [];
            forIn(decorators, (decorator, store) => {
                if (decorator._added || decorator._updated || decorator._deleted) {
                    delete decorator._added;
                    delete decorator._updated;
                    ps.push(collection.getDb().put(decorator));
                }
            });

            let fetch = [];
            forIn(search_keys_ref, (sk_ref, value) => {
                if (sk_ref._added) {
                    delete sk_ref._added;
                    ps.push(collection.getDb().put({ _id: sk_ref.ref }))
                    ps.push(collection.getDb().put(sk_ref));
                }
                if (sk_ref._deleted) {
                    fetch.push(collection.getDb().get(sk_ref.ref));
                    ps.push(collection.getDb().put(sk_ref));
                    unset(search_keys_ref, value);
                }
            }) 

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
    rollback() : Promise<EntityBase> {
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
                return resolved(t);
            }

            Promise.all(ps).then((ds) => {
                for(let d of ds) {
                    t.decorators[d.store] = d;
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
        
        forIn(this.decorators, (d, store) => {
            let index = findIndex(ds, { id: d._id });
            if (index != -1) {
                d._rev = ds[index].rev;
            }
        })

        forIn(this.search_keys_ref, (sk_ref, value) => {
            let index = findIndex(ds, { id: sk_ref._id });
            if (index != -1) {
                sk_ref._rev = ds[index].rev;   
            }
        })
    }

}
