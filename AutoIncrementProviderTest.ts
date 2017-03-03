import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { ApplicationSettings } from './ApplicationSettings';
import { AutoIncrementProvider } from './AutoIncrementProvider';

import * as _ from 'lodash';

/**
 * Gneral usage of all collections
 * Intended to be used as singleton per type
 */
@suite class AutoIncrementProviderTest {

    static db: PouchDB;
    static settings: ApplicationSettings;

    static before() {
        let db_name = 'AutoIncrementProviderTest' + Math.random();
        AutoIncrementProviderTest.db = new PouchDB(db_name);
        AutoIncrementProviderTest.settings = new ApplicationSettings(AutoIncrementProviderTest.db);
    }

    static after(done) {
        AutoIncrementProviderTest.db.destroy().then(function (response) {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("getNext should return start value")
    testAutoIncrementGetNext(done: Function) {
        let autoIncrementProvider = new AutoIncrementProvider('testAutoIncrementGetNext', AutoIncrementProviderTest.settings);
        autoIncrementProvider.getNext().then((v) => {
            if (v != AutoIncrementProvider._start) {
                throw new Error("start value is not initialized");
            }
            done();
        }).catch(_.noop)
    }

    @test ("getNext runs twice should return start value + 1")
    testDoubleGetNext(done: Function) {
        let autoIncrementProvider = new AutoIncrementProvider('testDoubleGetNext', AutoIncrementProviderTest.settings);
        autoIncrementProvider.getNext().then((v) => {
            return autoIncrementProvider.getNext();
        }).then((v) => {
            if (v != AutoIncrementProvider._start + 1) {
                throw new Error("should increment twice");
            };
            done();
        }).catch(_.noop)
    }

    @test ("getNext runs 3 times should return start value + 2")
    testTrippleGetNext(done: Function) {
        let autoIncrementProvider = new AutoIncrementProvider('testTrippleGetNext', AutoIncrementProviderTest.settings);
        autoIncrementProvider.getNext().then((v) => {
            return autoIncrementProvider.getNext();
        }).then((v) => {
            return autoIncrementProvider.getNext();
        }).then((v) => {
            if (v != AutoIncrementProvider._start + 2) {
                throw new Error("should increment 3 times");
            };
            done();
        }).catch(_.noop)
    }


}
