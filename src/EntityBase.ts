/**
 * Base class for entity, which is the building block of the data structure.
 * Each entity holds one main coreument representing an instance of the entity
 * and sub coreuments that hold metadata and search terms for this entity.
 */
import * as PouchDB from 'pouchdb';
import { map, assign, omitBy, isNil, findIndex, pullAllBy, filter, forIn, unset, values, forInRight } from 'lodash';
import { EntityCollectionBase } from './EntityCollectionBase'
import { Promise } from 'ts-promise';

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
     * @var the bucket objects
     */
    public buckets = {};

    /**
     * @var the search keys objects
     */
    public search_keys_ref = {};

    constructor(collection: EntityCollectionBase, id : string, core: any, buckets?, search_keys_ref?) {
        if (!core) {
            throw new TypeError("Missing type or db");
        }

        this._collection = collection;
        this._id = id;
        this.core = core;
        if (buckets) {
            this.buckets = buckets;
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

    addBucket(name: string, bucket: any) {
        if (!name || !bucket || name.length == 0) {
            throw new Error("unable to add store-less, empty bucket");
        }

        var d = this.buckets[name];
        if (d) {
            throw new Error("unable to add existing bucket. (" + name + ")");
        }

        bucket._id = this._collection.prefix + this._id + '/' + name;
        bucket._added = true;
        bucket.store = name;
        this.buckets[name] = bucket;

        return this;
    }

    updateBucket(name: string, bucket: any) {
        if (!name || !bucket) {
            throw new Error("unable to add store-less, empty bucket");
        }
        
        if (!this.buckets[name]) {
            this.buckets[name] = { 
                store: name, 
                _added: true,
                _id: this._collection.prefix + this._id + '/' + name
            };
        }

        var d = this.buckets[name];
        assign(d, bucket);
        omitBy(d, isNil);

        // if recently added just do the add, otherwise mark for update
        if (!d._added) {
            d._updated = true;
        }
        return this;
    }

    addSearchKey(key, value) {
        if (!value || !key) {
            return this;
        }
        let keyval = key + '/' + value;
        var sk = this.search_keys_ref[keyval];
        if (sk) {
            if (sk._deleted) {
                delete sk._deleted;
            } 
            return this; 
        }

        let ref = this._collection.prefix + keyval + '/' + this._id;
        this.search_keys_ref[keyval] = {
            _id: this._collection.prefix + this._id + '/sk/' + keyval,
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
        let buckets = this.buckets;
        let collection = this._collection;
        let search_keys_ref = this.search_keys_ref;

        return new Promise((resolved, rejected) => {

            let ps = [];
            forIn(buckets, (bucket, store) => {
                if (bucket._added || bucket._updated) {
                    delete bucket._added;
                    delete bucket._updated;
                    ps.push(collection.getDb().put(bucket));
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
            pullAllBy(t.buckets, [{ rev : undefined }], 'rev');
            pullAllBy(t.search_keys_ref, [{ rev : undefined }], 'rev');

            // revert the deleted search keys
            let dsks = filter(t.search_keys_ref, (d) => d._deleted);
            for (let sk of dsks) {
                delete sk._deleted ;
            }
 
            // refresh the buckets that were updated
            let dds = filter(t.buckets, (d) => (d._updated));
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
                    t.buckets[d.store] = d;
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
        
        forIn(this.buckets, (d, store) => {
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
