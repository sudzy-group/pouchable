/**
 * Represents each entity in the system 
 */
import { map } from 'lodash';
import { EntityBase } from './EntityBase'

/**
 * Base class of entity, should not be used directly
 */
export class Entity  {

    /**
     * Needed for the basic CRUD operations
     */
    protected _base : EntityBase;

    constructor(base: EntityBase) {
        this._base = base;
    }

    _getter(key) {
                

    }

}
