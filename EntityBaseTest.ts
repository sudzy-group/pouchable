import * as PouchDB from 'pouchdb';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import { EntityCollectionBase } from './EntityCollectionBase';
import { EntityBase } from './EntityBase';
import * as _ from 'lodash'

@suite class EntityBaseTest {

    static db_name : string;
    static db: PouchDB;
    static collection: EntityCollectionBase;

    static before() {
        EntityBaseTest.db_name = 'EntityTest' + Math.random();
        EntityBaseTest.db = new PouchDB(EntityBaseTest.db_name);
        EntityBaseTest.collection = new EntityCollectionBase("post", EntityBaseTest.db);
    }

    static after(done) {
        EntityBaseTest.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert doc should return entity")
    testAddDecorator(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }).then((e) => {
            let o = e.decorators.length;
            e.addDecorator('my-store', { b : "v"});
            if (e.decorators.length != o + 1) {
                throw new Error('addition failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update decorator")
    testUpdateDecorator1(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c" }]).then((e) => {
            let o = e.decorators.length;
            e.updateDecorator('my-store', { b : "v", c: 1});
            if (e.decorators.length != o || e.decorators[0].b != "v" || e.decorators[0].c != 1) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update decorator with nil value")
    testUpdateDecorator2(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c", d: "d" }]).then((e) => {
            let o = e.decorators.length;
            // unsetting c and d properties, changing b's value
            e.updateDecorator('my-store', { b : 1, c: null, d: undefined});
            var d = e.decorators[0]
            if (e.decorators.length != o || d.b != 1 || d.c || d.d || !d._updated) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key")
    testAddSearchKey(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }).then((e) => {
            e.addSearchKey('a', 'b');
            if (e.search_keys_ref.length != 1 || !e.search_keys_ref[0]._added) {
                throw new Error('remove failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key and then remove")
    testAddRemoveSearchKey(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }).then((e) => {
            e.addSearchKey('a', 'b');
            e.removeSearchKey('b');
            if (e.search_keys_ref.length != 0) {
                throw new Error('remove failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("save no op")
    testSaveNoOperation(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: 'number', val: 'testSaveNoOperation' }]).then((e) => {
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testSaveNoOperation');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 0) {
                throw new Error("entity was not decorated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("insert doc should return entity")
    testAddDecoratorAndSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: 'number', val: 'testAddDecoratorAndSave' }]).then((e) => {
            e.addDecorator('my-store', { b : "v"});
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddDecoratorAndSave');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 1) {
                throw new Error("entity was not decorated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update and save")
    testUpdateAndSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, [ {store: 'my-store', email : "roy@sudzy.co"} ],
        [{ key: 'number', val: 'testUpdateAndSave' }]).then((e) => {
            e.updateDecorator('my-store', {email : "hbarr@sudzy.co", mobile: "6465490000"});
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testUpdateAndSave');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 1 || !es[0].decorators[0].mobile) {
                throw new Error("entity was not updated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key and find")
    testAddSearchKeyAndSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined,
        [{ key: 'number', val: 'testAddSearchKey' }]).then((e) => {
            e.addSearchKey('a', 'testAddSearchKey123')
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddSearchKey123');
        }).then((es) => {
            if (es.length != 1) {
                throw new Error("entity was not updated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("remove search key and find")
    testRemoveSearchKeyAndSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined,
        [{ key: 'number', val: 'testRemoveSearchKeyAndSave' }]).then((e) => {
            e.removeSearchKey('testRemoveSearchKeyAndSave')
            return e.save();
        }).then((e) => {
            if (e.search_keys_ref.legnth > 0) {
                throw new Error("Error removing search key");
            }
            return EntityBaseTest.collection.findByKey('testRemoveSearchKeyAndSave');
        }).then((es) => {
            if (es.length != 0)  {
                throw new Error("search key was not removed")
            }
            return done();
        }).catch(_.noop);
    }    

    @test ("add search key and rollback")
    testAddSearchKeyAndRollback(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined,
        [{ key: 'number', val: 'testAddSearchKeyAndRollback' }]).then((e) => {
            e.addSearchKey('a', 'testAddSearchKeyAndRollback123')
            return e.rollback();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddSearchKeyAndRollback123');
        }).then((es) => {
            if (es.length != 0) {
                throw new Error("entity was added unexpectedly")
            }
            return done();
        }).catch(_.noop);
    }    

    @test ("insert decorator and rollback should not return decorator")
    testAddDecoratorAndRollback(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: 'number', val: 'testAddDecoratorAndRollback' }]).then((e) => {
            e.addDecorator('my-store', { b : "v"});
            return e.rollback();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddDecoratorAndRollback');
        }).then((es) => {
            if (es.length != 1 || es[0].decorators.length != 0) {
                throw new Error("entity was decorated")
            }
            return done();
        }).catch(_.noop);
    }    

}
