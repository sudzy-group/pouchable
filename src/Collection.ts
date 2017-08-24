/**
 * Represents a resource collection in the system
 */
import { map, forIn, keys, values, isFunction, isUndefined, isEqual } from 'lodash';
import { EntityBase } from './EntityBase'
import { EntityCollectionBase } from './EntityCollectionBase';
import { EntityConstructor } from './EntityConstructor';
import { Entity } from './Entity';
import * as PouchDB from 'pouchdb';
import { Promise } from 'ts-promise';

/**
 * Base class of the different resources in the system
 */
export abstract class Collection<T extends Entity> {
    
    /** collection specific */
    // base collection reference
    private _collectionBase : EntityCollectionBase;

    // helper constructor of the entity
    private _ctor: EntityConstructor<T>;

    public constructor(db, ctor: EntityConstructor<T>) {
        this._ctor = ctor;
        this._collectionBase = new EntityCollectionBase(this.getPrefix(), db);
    }
    
    /**
     * The name of the collection
     */
    public abstract getPrefix(): string;

    public insert(data, created_at: number = null) : Promise<T> { 
        return new Promise<T>((resolved, rejected)=> {
            let c = this._resolveCore(data, created_at);
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
        return new Promise<T>((resolved, rejected)=> {
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
        return new Promise<T[]>((resolved, rejected)=> {
            let t = this;
            this._collectionBase.findByKey(key, value, options).then((ebs) => {
                let entities = map(ebs, (eb) => { 
                    return new t._ctor(eb)
                });
                return resolved(entities);
            }).catch((m) => {
                return rejected(m)
            });
        })
    } 

    /**
     * Find ids by key/value. 
     * @param key 
     * @param value 
     * @param options 
     */
    public findIds(key, value, options?) : Promise<any[]> { 
        return new Promise<any[]>((resolved, rejected)=> {
            let t = this;
            this._collectionBase.findIdsbyKey(key, value, options).then((ebs) => {
                return resolved(ebs);
            }).catch((m) => {
                return rejected(m)
            });
        })
    } 

    /**
     * Find by range of ids
     * @param key 
     * @param value 
     * @param options 
     */
    public findByIds(from, to, options?) : Promise<any[]> { 
        return new Promise<any[]>((resolved, rejected)=> {
            let t = this;
            this._collectionBase.findByIds(from, to, options).then((ebs) => {
                let entities = map(ebs, (eb) => { 
                    return new t._ctor(eb)
                });
                return resolved(entities);
            }).catch((m) => {
                return rejected(m)
            });
        })
    } 

    /**
     * Find by range of ids
     * @param key 
     * @param value 
     * @param options 
     */
    public findIdsByRange(from, to, options?) : Promise<any[]> { 
        return new Promise<any[]>((resolved, rejected)=> {
            let t = this;
            this._collectionBase.findIdsByRange(from, to, options).then((ids) => {
                return resolved(ids);
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
        return new Promise<T>((resolved, rejected)=> {
            // make sure we only update the relevant data
            data = this._resolveData(entity, data);
            
            // resolve the keys that needs to be added/removed
            let skc = this._resolveSearchKeyChanges(entity, data);
            
            // resolve the buckets 
            let bs = this._resolveBuckets(data);

            // do the change all together
            return entity.updateBuckets(bs, skc).then((t) => {
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
    public remove(entity : Entity) : Promise<Entity> { 
        return new Promise<Entity>((resolved, rejected)=> {
            this._collectionBase.remove(entity._base).then((t) => {
                return resolved(entity)
            }).catch((m) => {
                return rejected(m);
            });
        })
    } 
        
    private _resolveCore(data, created_at): any {
        let md = this._ctor.prototype.metadata;
        let result: any = {};
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
        if (created_at) {
            result.created_at = created_at;
        }
        return result;
     }

     private _resolveBuckets(data) {
        let md = this._ctor.prototype.metadata;
        let result = {};
        let t = this;
        forIn(data, (value, key) => {
            let mk = md[key];
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
                    !isUndefined(val) && result.push({ key: key, val: val });
                }                
            }
        })
        return result;
     }

     private _resolveSearchKeyChanges(entity: Entity, data) {
        let md = this._ctor.prototype.metadata;
        let result = { add: [], remove: []};
        let t = this;

        forIn(data, (value, key) => {
            let mk = md[key];
            if (mk && !mk.mandatory && mk.search_by) {
                result.remove.push(key);
                let fs = mk.search_by;
                for (let f of fs) {
                    let val = isFunction(f) ? f(value) : t._ctor.prototype[f](value);
                    !isUndefined(val) && result.add.push({ key: key, val: val });
                }                
            }
        })
        return result;
     }

     private _resolveData(entity, data) {
        let md = this._ctor.prototype.metadata;
        let result = { };

        forIn(data, (value, key) => {
            let mk = md[key];
            if (!mk || mk.mandatory) {
                throw new Error("cannot update key " + key);
            }                      
            let bucket = entity._base.buckets[mk.group];
            if (!bucket || !isEqual(value, bucket[key])) {
                result[key] = value;    
            }
         });

         return result;
     }
}