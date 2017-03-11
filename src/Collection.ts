/**
 * Represents a resource collection in the system
 */
import { map, forIn, keys, values, isFunction, isUndefined } from 'lodash';
import { EntityBase } from './EntityBase'
import { EntityCollectionBase } from './EntityCollectionBase';
import { EntityConstructor } from './EntityConstructor';
import { Entity } from './Entity';
import * as PouchDB from 'pouchdb';

/**
 * Base class of the different resources in the system
 */
export class Collection<T extends Entity> {
    
    /** collection specific */
    // base collection reference
    private _collectionBase : EntityCollectionBase;

    // helper constructor of the entity
    private _ctor: EntityConstructor<T>;

    private _prefix;

    public constructor(db, ctor: EntityConstructor<T>) {
        this._prefix = ctor.name;
        this._ctor = ctor;
        this._collectionBase = new EntityCollectionBase(this.getPrefix(), db);
    }
    
    /**
     * The name of the collection
     */
    public getPrefix() : string {
        return this._prefix;
    }

    public insert(data) : Promise<T> { 
        return new Promise((resolved, rejected)=> {
            let c = this._resolveCore(data);
            let b = values(this._resolveBuckets(data));
            let sks = this._resolveSearchKeys(data);
            this._collectionBase.insert(c, b, sks).then((eb) => {
                return resolved(new this._ctor(eb));
            }).catch((m) => {
                return rejected(m)
            });
        })
    }

    /**
     * Get entity by its id
     * @param id 
     */
    public get(id) : Promise<T> { 
        return new Promise((resolved, rejected)=> {
            this._collectionBase.getById(id).then((eb) => {
                return resolved(new this._ctor(eb));
            }).catch((m) => {
                return rejected(m)
            });
        })
    }    

    /**
     * Find entity by key/value. 
     * @param key 
     * @param value 
     * @param options 
     */
    public find(key, value, options?) : Promise<T[]> { 
        return new Promise((resolved, rejected)=> {
            let t = this;
            this._collectionBase.findByKey(key, value, options).then((ebs) => {
                return resolved(map(ebs, (eb) => { return new t._ctor(eb)}) );
            }).catch((m) => {
                return rejected(m)
            });
        })
    } 

    /**
     * Find entity by key/value. 
     * @param key 
     * @param value 
     * @param options 
     */
    public update(entity : Entity, data) : Promise<T> { 
        return new Promise((resolved, rejected)=> {
            let bs = this._resolveBuckets(data);
            return entity.updateBuckets(bs).then((t) => {
                return resolved(t)
            }).catch((m) => {
                return rejected(m);
            });
        })
    } 
    
    /**
     * Remove entity
     * @param entity 
     */
    public remove(entity : Entity) : Promise<T> { 
        return new Promise((resolved, rejected)=> {
            this._collectionBase.remove(entity._base).then((t) => {
                return resolved(entity)
            }).catch((m) => {
                return rejected(m);
            });
        })
    } 
        
    private _resolveCore(data) {
        let md = this._ctor.prototype.metadata;
        let result = {};
        let t = this;
        forIn(data, (value, key) => {
            let mk = md[key];
            if (!mk) {
                throw new Error("missing definition for " + key);
            }
            if (mk.mandatory) {

                // validate value 
                let f = mk.validate;
                let isValid = isFunction(f)? f(value) : (isUndefined(f) || t._ctor.prototype[f](value));
                if (!isValid) {
                    throw new Error("Error assigning key " + key + " to value " + value);
                }

                // assign key / value to core 
                result[key] = value;
            }
        })

        // makes sure all mandatory fields were assigned
        let c = 0;
        forIn(md, (md) => {
            if (md.mandatory) {
                c++
            }
        })
        if (c != keys(result).length) {
            throw new Error("missing mandatory");
        }
        return result;
     }

     private _resolveBuckets(data) {
        let md = this._ctor.prototype.metadata;
        let result = {};
        let t = this;
        forIn(data, (value, key) => {
            let mk = md[key];
            if (!mk) {
                throw new Error("cannot resolve key " + key);
            }
            if (!mk.mandatory) {
                // validate value 
                let f = mk.validate;
                let isValid = isFunction(f)? f(value) : (isUndefined(f) || t._ctor.prototype[f](value));
                if (!isValid) {
                    throw new Error("Error assigning key " + key + " to value " + value);
                }

                let g = mk.group;
                (result[g] || (result[g] = { store: g}))[key] = value;
            }
        })
        return result;
     }

     private _resolveSearchKeys(data): any[] {
        let md = this._ctor.prototype.metadata;
        let result = [];
        let t = this;
        forIn(data, (value, key) => {
            if (md[key] && md[key].search_by) {
                let fs = md[key].search_by;
                for (let f of fs) {
                    let val = isFunction(f) ? f(value) : t._ctor.prototype[f](value);
                    result.push({ key: key, val: val });
                }                
            }
        })
        return result;
     }
}