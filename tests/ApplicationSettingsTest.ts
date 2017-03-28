import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { ApplicationSettings } from '../src/ApplicationSettings';
import * as _ from 'lodash';
import { Promise } from 'ts-promise';


@suite class ApplicationSettingsTest {

    static db: PouchDB;
    static settings: ApplicationSettings;

    static before() {
        let db_name = 'ApplicationSettings' + Math.random();
        ApplicationSettings.db = new PouchDB(db_name);
    }

    static after(done) {
        ApplicationSettings.db.destroy().then(function (response) {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("isExists should return no for missing key")
    testIsExists(done: Function) {
        let settings = new ApplicationSettings(ApplicationSettings.db);
        settings.isExists('missing-key').then((exists) => {
            if (!exists) {
                done();
            }
        }).catch(_.noop)
    }

    @test ("application settings with no db")
    testMissingDb() {
        try {
            let settings = new ApplicationSettings(undefined);
        } catch(e) {
            return
        }
        throw new Error("created with missing db");
    }

    @test ("set should store 5")
    testSetAndIsExists(done: Function) {
        let settings = new ApplicationSettings(ApplicationSettings.db);
        settings.set('mykey1', 5).then(() => {
            return settings.isExists('mykey1');
        }).then((exists) => {
            if (exists) { done() }
        }).catch(_.noop);
    }

    @test ("get after set should return the value")
    testSetAndGet(done: Function) {
        let settings = new ApplicationSettings(ApplicationSettings.db);
        settings.set('mykey2', 5).then(() => {
            return settings.get('mykey2');
        }).then((value) => {
            if (value == 5) {
                done()
            }
        }).catch(_.noop);
    }

    @test ("get after set then get should not return the value")
    testSetAndRemoveAndGet(done: Function) {
        let settings = new ApplicationSettings(ApplicationSettings.db);
        settings.set('mykey3', 5).then(() => {
            return settings.get('mykey3');
        }).then(function(value) {
            return settings.remove('mykey3');
        }).then((value) => {
            return settings.isExists('mykey3');
        }).then((isExists) => {
            if (!isExists) {
                done();
            }
        }).catch(function(m) {
        });
    }

    @test ("get after set then set should return the updated value")
    testSetAndSetAndGet(done: Function) {
        let settings = new ApplicationSettings(ApplicationSettings.db);
        settings.set('mykey4', 5).then(() => {
            return settings.get('mykey4');
        }).then((value) => {
            return settings.set('mykey4', 6);
        }).then(function(value) {
            return settings.get('mykey4');
        }).then((value) => {
            if (value == 6) {
                done();
            }
        }).catch(function(m) {
            console.log(m)
        });
    }
}
