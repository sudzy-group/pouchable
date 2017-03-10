/**
 * Represents a resource collection in the system
 */
import * as PouchDB from 'pouchdb';
import { map, forIn, keys, values, isFunction } from 'lodash';
import { EntityBase } from './EntityBase'
import { EntityCollectionBase } from './EntityCollectionBase';
import { EntityConstructor } from './EntityConstructor';
import { Entity } from './Entity';

/**
 * Base class of the different resources in the system
 */
export abstract class Collection<T extends Entity> {
    
    /** collection specific */
    // base collection reference
    private _collectionBase : EntityCollectionBase;

    // helper constructor of the entity
    private _ctor: EntityConstructor<T>;

    public constructor(db: PouchDB, ctor: EntityConstructor<T>) {
        this._ctor = ctor;
        this._collectionBase = new EntityCollectionBase(this.getName(), db);
    }
    
    /**
     * The name of the collection
     */
    public abstract getName() : string;

    public insert(data) : Promise<T> { 
        return new Promise((resolved, rejected)=> {
            let c = this._resolveCore(data);
            let b = this._resolveBuckets(data);
            let sks = this._resolveSearchKeys(data);
            this._collectionBase.insert(c, b, sks).then((eb) => {
                return resolved(new this._ctor(eb));
            }).catch((m) => {
                return rejected(m)
            });
        })
    }

    public get(id) : Promise<T> { 
        return new Promise((resolved, rejected)=> {
            this._collectionBase.getById(id).then((eb) => {
                return resolved(new this._ctor(eb));
            }).catch((m) => {
                return rejected(m)
            });
        })
    }    

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


     private _resolveCore(data) {
        let md = this._ctor.prototype.metadata;
        let result = {};
        forIn(data, (value, key) => {
            if (!md[key]) {
                throw new Error("missing definition for " + key);
            }
            if (md[key].mandatory) {
                result[key] = value;
            }
        })
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
        forIn(data, (value, key) => {
            if (!md[key].mandatory) {
                let g = md[key].group;
                (result[g] || (result[g] = { store: g}))[key] = value;
            }
        })
        return values(result);
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