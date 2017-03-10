/**
 * Represents each entity in the system, wrapper of EntityBase
 */
import { map, forIn } from 'lodash';
import { EntityBase } from './EntityBase'
import { Collection } from './Collection'

/**
 * Base class of entity, should not be used directly
 */
export class Entity  {

    /**
     * the basic entity, should not be used by implementors
     */
    public _base : EntityBase;

    constructor(base: EntityBase) {
        this._base = base;
    }

    /**
     * Metadata for a given key
     * @param key returns the metadata for a given key
     */
    protected getMetadata(key) {
        return this.metadata[key];
    }

    get id() {
        return this._base.core.index;
    }

    /**
     * Get the value of the property 
     * @param key 
     */
    protected getValue(key) {
        let md = this.getMetadata(key);
        return md.mandatory ? this._base.core[key] : this._base.buckets[md.group][key];
    }

    public updateBuckets(buckets) : Promise<Entity> {
        return new Promise((resolved, rejected) => {
            let t = this;
            forIn(buckets, (bucket, name) => {
                this._base.updateBucket(name, bucket);
            })
            this._base.save().then((e) => {
                return resolved(t)
            }).catch((m) => {
                return rejected(m);
            })
        })
    }
}
