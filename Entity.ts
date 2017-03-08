/**
 * Represents each entity in the system, wrapper of EntityBase
 */
import { map } from 'lodash';
import { EntityBase } from './EntityBase'
import { Repository } from './Repository'

/**
 * Base class of entity, should not be used directly
 */
export class Entity  {

    /**
     * the basic entity
     */
    protected _base : EntityBase;

    /**
     * the entity metadata repository
     */
    protected _repo : EntityRepository;

    constructor(base: EntityBase) {
        this._base = base;
    }

    private _getter(key) {
        let name = this._repo._getBucket(key);
        return this._base.buckets[name] && this._base.buckets[name].key;
    }

    private _setter(key, value) {
        let name = this._repo._getBucket(key);
        if (!this._base.buckets[name]) {
            this._base.addBucket(name, { key : value });
        } else {
            this._base.updateBucket(name, { key : value })
        }
        return this;
    }

    public save() {
        let t = this;
        new Promise((resolved, rejected) => {
            this._base.save().then(() => {
                return resolved(t);
            }).catch(() => {
                return rejected('unable to save entity')
            })
        });      
    }

    public rollback() {
        let t = this;
        new Promise((resolved, rejected) => {
            this._base.rollback().then(() => {
                return resolved(t);
            }).catch(() => {
                return rejected('unable to rollback entity')
            })
        });      
    }
}
