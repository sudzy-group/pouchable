/**
 * Basic auto increment provider
 */
import * as PouchDB from 'pouchdb';
import { ApplicationSettings } from './ApplicationSettings';

/**
 * Gneral usage of all collections
 * Intended to be used as singleton per type
 */
export class AutoIncrementProvider {

    static _start = 1000;

    /**
     * @var the type of the auto increment
     */
    private _type: string;

    /**
     * @var application settings
     */
    protected _settings: ApplicationSettings;

    constructor(type: string, settings: ApplicationSettings) {
        this._settings = settings;
        this._type = 'auto-increment/' + type;
    }

    getNext() {
        return new Promise((resolved, rejected) => {
            this._settings.get(this._type).then((v) => {
                return this._settings.set(this._type, v + 1);
            }).then((v) => {
                resolved(v);
            }).catch(() => {
                return this._settings.set(this._type, AutoIncrementProvider._start);
            }).then((v) => {
                resolved(v);
            }).catch(rejected);
        });
    }

}
