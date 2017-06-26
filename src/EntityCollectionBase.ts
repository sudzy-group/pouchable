/**
 * Base class for entity collection methods
 * constructing, destructing and querying
 */
import * as PouchDB from 'pouchdb';
import { concat, compact, map, startsWith, findIndex, values, keys, uniq, uniqBy, defaults, forIn, isUndefined } from 'lodash';

import { IdGenerator } from './IdGenerator';
import { DateIdGenerator } from './DateIdGenerator';
import { EntityBase } from './EntityBase';
import { Promise } from 'ts-promise';

/**
 * Gneral usage of all collections
 * Intended to be used as singleton per type
 */
export class EntityCollectionBase {

    /**
     * @var the type of the collection (like 'posts', 'customers', etc.)
     */
    public type : string;

    /**
     * @var the prefix used to identify the type
     */
    public prefix : string;

    /**
     * @var the db connection
     */
    protected _db;

    /**
     * Generates id for the entity
     */
    protected _idGenerator: IdGenerator;

    constructor(type: string, db, idGenerator?: IdGenerator) {
        if (!type || !db) {
            throw new TypeError("Missing type or db");
        }
        this.type = type;
        this.prefix = type + '/';
        this._db = db;
        this._idGenerator = idGenerator ? idGenerator : new DateIdGenerator()
    }

    /**
     * Insert a new entity
     */
    insert(core, buckets?: any[], keys? : any[]) : Promise<EntityBase> {

        return new Promise<EntityBase>((resolved, rejected) => {
            // generate id
            let id = this._idGenerator.get();
            let e_core = this._resolveCore(core, id);
            let e_buckets = buckets ? this._resolveBuckets(buckets, id) : {};
            let e_search_keys_ref = keys ? this. _resolveSearchKeysRef(keys, id) : {};
            let search_keys = keys ? this._resolveSearchKeys(e_search_keys_ref, id) : [];
            let e = new EntityBase(this, id, e_core, e_buckets, e_search_keys_ref);
            var all = compact(concat(e_core, values(e_buckets), values(e_search_keys_ref), search_keys));
            this._db.bulkDocs(all).then((ds) => {
                e.resolveRevs(ds);
                return resolved(e);
            }).catch((m) => rejected(new Error(m)));
        })
    }

    /**
     * Remove entity from the collection
     */
    remove(entity) {
        return new Promise((resolved, rejected) => {
            if (keys(entity.search_keys_ref).length == 0) {
                let all = compact(concat(entity.core, values(entity.buckets)));
                return this._removeEntityDocs(all, resolved, rejected, entity)
            }

            let refs = map(values(entity.search_keys_ref), 'ref');
            let ps = [];
            for (let ref of refs) {
                ps.push(this._db.get(ref));
            }

            return Promise.all(ps).then((docs) => {
                let all = compact(concat(entity.core, values(entity.buckets), values(entity.searchKeys), docs));
                return this._removeEntityDocs(all, resolved, rejected, entity)
            })
        })
    }

    /**
     * Get entity by id
     */
    getById(id) : Promise<EntityBase> {
        return new Promise<EntityBase>((resolved, rejected) => {
            // generate id
            let prefix = this.prefix + id + "/";
            this._db.allDocs({
                include_docs: true,
                startkey: prefix,
                endkey: prefix + "\uffff"
            }).then((docs) => {
                let e = this._createEntityFromDocs(docs, prefix, id);
                return resolved(e);
            }).catch((m) => {
                return rejected(new Error(m));
            })
        })
    }

    /**
     * Find entity by key search
     */
    findByKey(key, value, opts?) : Promise<EntityBase[]> {
        return new Promise<EntityBase[]>((resolved, rejected) => {
            let startsWith = opts && opts.startsWith
            let gte = opts && opts.gte;
            let search = this.prefix + key + '/' + value + (startsWith ? "" : "/");
            this._db.allDocs(defaults(opts, {
                include_docs: false,
                startkey: search,
                endkey: gte ? undefined : (search + "\uffff")
            })).then((docs) => {
                // resolve all ids from the serach keys
                var ids = uniq(map(docs.rows, (r: any) => {
                    var start = startsWith ? r.id.indexOf('/', search.length) + 1 : search.length;
                    return r.id.substr(start)
                }));
                let ps = [];
                for (let id of ids) {
                    ps.push(this.getById(id));
                }
                return Promise.all(ps);
            }).then((entities) => {
                return resolved(entities);
            }).catch((m) => {
                return rejected(new Error(m));
            })
        })
    }

    /**
     * Finds all ids by a key/values search
     */
    findIdsbyKey(key, value, opts?) : Promise<any[]> {
        return new Promise<any[]>((resolved, rejected) => {
            let startsWith = opts && opts.startsWith
            let gte = opts && opts.gte;
            var pk = this.prefix + key + '/';
            let search = pk + value + (startsWith ? "" : "/");
            this._db.allDocs(defaults({
                include_docs: false,
                startkey: search,
                endkey: gte ? undefined : (search + "\uffff")
            }, opts)).then((docs) => {
                // resolve all ids from the serach keys
                var ids = uniqBy(map(docs.rows, (r : any) => {
                    let ss = r.id.split('/');
                    return { value: ss[2], id : ss[3] };
                }), 'id');
                return resolved(ids);
            }).catch((m) => {
                return rejected(new Error(m));
            })
        })
    }

    /**
     * Returns the parent database
     */
    getDb() {
        return this._db;
    }

    _createEntityFromDocs(docs, prefix, id) {
        let core = null;
        let buckets = {};
        let search_keys_ref = {};
        for (let result of docs.rows) {
            if (result.doc._id == prefix) {
                core = result.doc;
            } else if (startsWith(result.doc._id, prefix + 'sk')) {
                search_keys_ref[result.doc._id.substr(prefix.length + 3)] = result.doc;
            } else {
                buckets[result.doc.store] = result.doc;
            }
        }
        return new EntityBase(this, id, core, buckets, search_keys_ref);
    }

    _resolveCore(core, id) {
        core._id = this.prefix + id + "/";
        let time = new Date().getTime();
        core.created_at = core.created_at || time;
        core.index = id;
        return core;
    }

    _resolveBuckets(buckets, id) {
        let result = {};
        for (let bucket of buckets) {
            if (!bucket.store) {
                throw new Error("Unable to decorate with empty store.");
            }
            bucket._id = this.prefix + id + '/' + bucket.store;
            result[bucket.store] = bucket;
        }
        return result;
    }

    _resolveSearchKeysRef(keys, id) {
        var result = {}
        for (let searchKey of keys) {
            if (isUndefined(searchKey.key) || isUndefined(searchKey.val)) {
                break;
            }
            let keyval = searchKey.key + '/' + searchKey.val;
            let ref = this.prefix + keyval + '/' + id;
            result[keyval] = {
                _id: this.prefix + id + '/sk/' + keyval,
                key: searchKey.key,
                ref: ref
            }
        }
        return result;
    }

    _resolveSearchKeys(keys, id) {
        var result = []
        forIn(keys, (searchKey) => {
            result.push({
                _id: searchKey.ref
            })
        })
        return result;
    }

    _removeEntityDocs(all, resolved, rejected, entity) {
        for (let d of all) {
            d._deleted = true;
        }
        return this._db.bulkDocs(all).then(() => {
            return resolved(entity);
        }).catch(() => {
            return rejected(entity);
        });
    }

}
