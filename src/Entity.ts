/**
 * Represents each entity in the system, wrapper of EntityBase
 */
import { map, forIn } from 'lodash';
import { EntityBase } from './EntityBase'
import { Collection } from './Collection'
import { Promise } from 'ts-promise';

/**
 * Base class of entity, should not be used directly
 */
export class Entity  {

    // holds all metadata information given by @EntityField
    public metadata;

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
        if (md.mandatory) {
            return this._base.core[key];
        }
        let bucket = this._base.buckets[md.group];
        return bucket ? bucket[key] : null;
    }

    public updateBuckets(buckets, skc) : Promise<Entity> {
        return new Promise<Entity>((resolved, rejected) => {
            let t = this;
            forIn(buckets, (bucket, name) => {
                this._base.updateBucket(name, bucket);
            })
            for (let skr of skc.remove) {
                this._base.removeSearchKey(skr);
            }
            for (let ska of skc.add) {
                this._base.addSearchKey(ska.key, ska.val);
            }
            this._base.save().then((e) => {
                return resolved(t)
            }).catch((m) => {
                return rejected(m);
            })
        })
    }
}
