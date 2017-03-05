/**
 * Base class for entity, which is the building block of the data structure.
 * Each entity holds one main coreument representing an instance of the entity
 * and sub coreuments that hold metadata and search terms for this entity.
 */
import * as PouchDB from 'pouchdb';
import { indexOf, map, intersection, assign, omitBy, isNil } from 'lodash';
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

    addDecorator(store: string, decorator: any) {
        if (!store || !decorator) {
            throw new Error("unable to add store-less, empty decorator");
        }

        let existing_stores = map(this.decorators, 'store');
        let conflict = indexOf(existing_stores, store);
        if (conflict >= 0) {
            throw new Error("unable to add existing decorator. (" + store + ")");
        }

        decorator._id = this._collection.prefix + store;
        decorator._added = true;
        this.decorators.push(decorator);
    }

    updateDecorator(store: string, decorator: any) {
        if (!store || !decorator) {
            throw new Error("unable to add store-less, empty decorator");
        }
        let existing_stores = map(this.decorators, 'store');
        let index = indexOf(existing_stores, store);
        if (index == -1) {
            throw new Error("unable to update missing decorator, use add instead (" + store + ")");
        }
        assign(this.decorators[index], decorator);
        omitBy(this.decorators[index], isNil);
        this.decorators[index]._updated = true;
    }

    // removeDecorators(decorator_id, [ decorators ]) : [ decorators ]
    // addSearchKey(key) : key
    // removeSearchKey(key) : key
    // save()
    // rollback()


}
