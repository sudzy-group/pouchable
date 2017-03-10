import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { ApplicationSettings } from '../ApplicationSettings';
import { AutoIncrementGenerator } from '../AutoIncrementGenerator';

import * as _ from 'lodash';

/**
 * Gneral usage of all collections
 * Intended to be used as singleton per type
 */
@suite class AutoIncrementGeneratorTest {

    static db: PouchDB;
    static settings: ApplicationSettings;

    static before() {
        let db_name = 'AutoIncrementGeneratorTest' + Math.random();
        AutoIncrementGeneratorTest.db = new PouchDB(db_name);
        AutoIncrementGeneratorTest.settings = new ApplicationSettings(AutoIncrementGeneratorTest.db);
    }

    static after(done) {
        AutoIncrementGeneratorTest.db.destroy().then(function (response) {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("getNext should return start value")
    testAutoIncrementGetNext(done: Function) {
        let autoIncrementGenerator = new AutoIncrementGenerator('testAutoIncrementGetNext', AutoIncrementGeneratorTest.settings);
        autoIncrementGenerator.get().then((v) => {
            if (v != AutoIncrementGenerator._start) {
                throw new Error("start value is not initialized");
            }
            done();
        }).catch(_.noop)
    }

    @test ("getNext runs twice should return start value + 1")
    testDoubleGetNext(done: Function) {
        let autoIncrementGenerator = new AutoIncrementGenerator('testDoubleGetNext', AutoIncrementGeneratorTest.settings);
        autoIncrementGenerator.get().then((v) => {
            return autoIncrementGenerator.get();
        }).then((v) => {
            if (v != AutoIncrementGenerator._start + 1) {
                throw new Error("should increment twice");
            };
            done();
        }).catch(_.noop)
    }

    @test ("getNext runs 3 times should return start value + 2")
    testTrippleGetNext(done: Function) {
        let autoIncrementGenerator = new AutoIncrementGenerator('testTrippleGetNext', AutoIncrementGeneratorTest.settings);
        autoIncrementGenerator.get().then((v) => {
            return autoIncrementGenerator.get();
        }).then((v) => {
            return autoIncrementGenerator.get();
        }).then((v) => {
            if (v != AutoIncrementGenerator._start + 2) {
                throw new Error("should increment 3 times");
            };
            done();
        }).catch(_.noop)
    }


}
