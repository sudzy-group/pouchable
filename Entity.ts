/**
 * Base class for entity, which is the building block of the data structure.
 * Each entity holds one main coreument representing an instance of the entity
 * and sub coreuments that hold metadata and search terms for this entity.
 */
import * as PouchDB from 'pouchdb';
import _ from 'lodash';
import { EntityCollection } from './EntityCollection'

/**
 * Each entity instance is
 */
export class Entity {

    /**
     * @var the collection
     */
    protected _collection : EntityCollection;

    /**
     * Unique id for this entity
     */
    protected _id : string;

    /**
     * @var the main doc of this entity
     */
    public core;

    /**
     * @var the decorator objects
     */
    public decorators : any[];

    /**
     * @var the search keys objects
     */
    public search_keys_ref : any[];

    constructor(collection: EntityCollection, id : string, core: any, decorators?: any[], search_keys_ref?: any[]) {
        if (!core) {
            throw new TypeError("Missing type or db");
        }

        this._collection = collection;
        this._id = id;
        this.core = core;
        this.decorators = decorators || [] ;
        this.search_keys_ref = search_keys_ref || [];
    }

}
