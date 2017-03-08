/**
 * Represents each entity in the system, wrapper of EntityBase
 */
import { map } from 'lodash';
import { EntityBase } from './EntityBase'
import { EntityRepository } from './EntityRepository'

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
    protected _repository : EntityRepository;

    constructor(base: EntityBase) {
        this._base = base;
    }

    private _getter(key) {
        
    }

}
