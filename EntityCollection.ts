/**
 * Base class for entity collection methods
 * constructing, destructing and querying
 */
import * as PouchDB from 'pouchdb';
import { concat, compact, map, startsWith } from 'lodash';

import { IdGenerator } from './IdGenerator';
import { DateIdGenerator } from './DateIdGenerator';
import { Entity } from './Entity';

/**
 * Gneral usage of all collections
 * Intended to be used as singleton per type
 */
export class EntityCollection {

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
    protected _db: PouchDB;

    /**
     * Generates id for the entity
     */
    protected _idGenerator: IdGenerator;

    constructor(type: string, db: PouchDB, idGenerator?: IdGenerator) {
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
    insert(core, decorators?: any[], keys? : any[]) {

        return new Promise((resolved, rejected) => {
            // generate id
            let id = this._idGenerator.get();
            let e_core = this._resolveCore(core, id);
            let e_decorators = decorators ? this._resolveDecorators(decorators, id) : [];
            let e_search_keys_ref = keys ? this. _resolveSearchKeysRef(keys, id) : [];
            let search_keys = keys ? this._resolveSearchKeys(keys, id) : [];

            let e = new Entity(this, id, e_core, e_decorators, e_search_keys_ref);
            var all = compact(concat(e_core, e_decorators, e_search_keys_ref, search_keys));
            this._db.bulkDocs(all).then(() => {
                return resolved(e);
            }).catch(rejected);
        })
    }

    /**
     * Remove entity from the collection
     */
    remove(entity) {
        return new Promise((resolved, rejected) => {
            // generate id
            if (entity.search_keys_ref.length == 0) {
                let all = compact(concat(entity.core, entity.decorators, entity.searchKeys));
                return this._removeEntityDocs(all, resolved, rejected, entity)
            }

            let refs = map(entity.search_keys_ref, 'ref');
            let ps = [];
            for (let ref of refs) {
                ps.push(this._db.get(ref));
            }

            return Promise.all(ps).then((docs) => {
                let all = compact(concat(entity.core, entity.decorators, entity.searchKeys, docs));
                return this._removeEntityDocs(all, resolved, rejected, entity)
            })
        })
    }

    /**
     * Get entity by id
     */
    getById(id) {
        return new Promise((resolved, rejected) => {
            // generate id
            let key = this.prefix + id + "/";
            this._db.allDocs({
                include_docs: true,
                startkey: key,
                endkey: key + "\uffff"
            }).then((docs) => {
                let e = this._createEntityFromDocs(docs, key, id);
                return resolved(e);
            }).catch(() => {
                return rejected('missing');
            })
        })
    }

    /**
     * Find entity by key search
     */
    findByKey(search, startsWith = false) {
        return new Promise((resolved, rejected) => {
            let key = this.prefix + search + (startsWith ? "" : "/");
            this._db.allDocs({
                include_docs: true,
                startkey: key,
                endkey: key + "\uffff"
            }).then((docs) => {
                // resolve all ids from the serach keys
                var ids = map(docs.rows, (r) => {
                    var start = startsWith ? r.id.indexOf('/', key.length) + 1 : key.length;
                    return r.id.substr(start)
                });
                let ps = [];
                for (let id of ids) {
                    ps.push(this.getById(id));
                }
                return Promise.all(ps);
            }).then((entities) => {
                return resolved(entities);
            }).catch(() => {
                return rejected('missing');
            })
        })
    }

    _createEntityFromDocs(docs, key, id) {
        let core = null;
        let decorators = [];
        let search_keys_ref = [];
        for (let result of docs.rows) {
            if (result.doc._id == key) {
                core = result.doc;
            } else if (startsWith(result.doc._id, key + 'sk')) {
                search_keys_ref.push(result.doc)
            } else {
                decorators.push(result.doc);
            }
        }
        return new Entity(this, id, core, decorators, search_keys_ref);
    }

    _resolveCore(core, id) {
        core._id = this.prefix + id + "/";
        let time = new Date().getTime();
        core.created_at = time;
        core.updated_at = time;
        core.type = this.type;
        core.index = id;
        return core;
    }

    _resolveDecorators(decorators, id) {
        for (let decorator of decorators) {
            if (!decorator.store) {
                throw new Error("Unable to decorate with empty store.");
            }
            decorator._id = this.prefix + id + '/' + decorator.store;
        }
        return decorators;
    }

    _resolveSearchKeysRef(keys, id) {
        var searchKeysRef = []
        for (let searchKey of keys) {
            if (!searchKey.key || !searchKey.val) {
                throw new Error();
            }
            let ref = this.prefix + searchKey.val + '/' + id;
            searchKeysRef.push({
                _id: this.prefix + id + '/sk/' + searchKey.key,
                ref: ref
            })
        }
        return searchKeysRef;
    }

    _resolveSearchKeys(keys, id) {
        var searchKeys = []
        for (let searchKey of keys) {
            let ref = this.prefix + searchKey.val + '/' + id;
            searchKeys.push({
                _id: ref
            })
        }
        return searchKeys;
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
