/**
 * Helps storing settings device-specific data
 * for example, printer ports, settings, user preferences, etc.
 *
 * Code Examples:
 *   settings.set('mykey4', 5).then(() => {
 *     return settings.get('mykey4');
 *   }).then((value) => {
 *     return settings.remove('mykey4', 6);
 *   })...
 */
import * as PouchDB from 'pouchdb';
import _ from 'lodash';

/**
 * @class ApplicationSettings
 */
export class ApplicationSettings {

    static _type = '_local/';

    protected _db;

    constructor(db) {
        if (!db) {
            throw new TypeError("Missing type or db");
        }
        this._db = db;
    }

    /**
     * returns true if the key exists in the settings
     */
    isExists(id) {
        return new Promise((resolve, reject) => {
            let r_id = this._resolveId(id);
            this._get(r_id).then((d) => {
                resolve(typeof(d) != "undefined");
            }).catch(function(m) {
                resolve(false);
            });
        })
    }

    /**
     * set or update a value in the store
     */
    set(id, value) {
        return new Promise((resolved, rejected) => {
            let r_id = this._resolveId(id);
            return this._get(r_id).then((e) => {
                let doc = {
                    _id: r_id,
                    _rev: e._rev,
                    value: value
                }
                return this._db.put(doc);
            }).then(() => {
                return resolved(value);
            }).catch((m) => {
                let doc = {
                    _id: r_id,
                    value: value
                }
                return this._db.put(doc);
            }).then(() => {
                return resolved(value);
            });
        });
    }

    /**
     * get the value of the id
     */
    get(id) {
        return new Promise((resolve, reject) => {
            let r_id = this._resolveId(id);
            this._get(r_id).then((d) => {
                d ? resolve(d.value) : reject('missing');
            }).catch(function() {
                reject();
            });
        });
    }

    /**
     * Removes a key,value from the store
     */
    remove(id) {
        let r_id = this._resolveId(id);
        return this._get(r_id).then((doc) => {
            return this._db.remove(doc);
        }).catch((m)=> {
            throw new Error(m);
        })
    }

    _resolveId(id) {
        let r_id = ApplicationSettings._type + id;
        return r_id;
    }

    _get(id) {
        return this._db.get(id);
    }
}
