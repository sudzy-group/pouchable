import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { EntityCollection } from './EntityCollection';
import { Entity } from './Entity';
import * as _ from 'lodash'

@suite class EntityTest {

    static db_name : string;
    static db: PouchDB;
    static collection: EntityCollection;

    static before() {
        EntityTest.db_name = 'EntityTest' + Math.random();
        EntityTest.db = new PouchDB(EntityTest.db_name);
        EntityTest.collection = new EntityCollection("post", EntityTest.db);
    }

    static after(done) {
        EntityTest.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert doc should return entity")
    testAddDecorator(done: Function) {
        EntityTest.collection.insert({ a: "b" }).then((e) => {
            let o = e.decorators.length;
            e.addDecorator('my-store', { b : "v"});
            if (e.decorators.length != o + 1) {
                throw new Error('addition failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("insert doc should return entity")
    testUpdateDecorator1(done: Function) {
        EntityTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c" }]).then((e) => {
            let o = e.decorators.length;
            e.updateDecorator('my-store', { b : "v", c: 1});
            if (e.decorators.length != o || e.decorators[0].b != "v" || e.decorators[0].c != 1) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("insert doc should return entity")
    testUpdateDecorator2(done: Function) {
        EntityTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c" }]).then((e) => {
            let o = e.decorators.length;
            e.updateDecorator('my-store', { b : 1, c: undefined});
            if (e.decorators.length != o || e.decorators[0].b != 1 || e.decorators[0].c) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

}
