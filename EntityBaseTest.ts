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
            let o = _.keys(e.buckets).length;
            e.addBucket('my-store', { b : "v"});
            if (_.keys(e.buckets).length != o + 1) {
                throw new Error('addition failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update decorator")
    testUpdateDecorator1(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c" }]).then((e) => {
            let o = _.keys(e.buckets).length;
            e.updateBucket('my-store', { b : "v", c: 1});
            if (_.keys(e.buckets).length != o || _.values(e.buckets)[0].b != "v" || _.values(e.buckets)[0].c != 1) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update decorator with nil value")
    testUpdateDecorator2(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, [ { store: 'my-store', c: "c", d: "d" }]).then((e) => {
            let o = _.keys(e.buckets).length;
            // unsetting c and d properties, changing b's value
            e.updateBucket('my-store', { b : 1, c: null, d: undefined});
            var d = e.buckets['my-store']
            if (_.keys(e.buckets).length != o || d.b != 1 || d.c || d.d || !d._updated) {
                throw new Error('update failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key")
    testAddSearchKey(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }).then((e) => {
            e.addSearchKey('a', 'b');
            if (_.keys(e.search_keys_ref).length != 1 || !_.values(e.search_keys_ref)[0]._added) {
                throw new Error('remove failed')
            }
            return done();
        }).catch(_.noop);
    }

    @test ("add search key and then remove")
    testAddRemoveSearchKey(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }).then((e) => {
            e.addSearchKey('a', 'b');
            e.removeSearchKey('a');
            if (_.keys(e.search_keys_ref).length != 0) {
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
            if (es.length != 1 || _.keys(es[0].buckets).length != 0) {
                throw new Error("entity was not decorated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("insert doc should return entity")
    testAddDecoratorAndSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: 'number', val: 'testAddDecoratorAndSave' }]).then((e) => {
            e.addBucket('my-store', { b : "v"});
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddDecoratorAndSave');
        }).then((es) => {
            if (es.length != 1 || _.keys(es[0].buckets).length != 1) {
                throw new Error("entity was not decorated")
            }
            return done();
        }).catch(_.noop);
    }

    @test ("update and save")
    testUpdateAndSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, [ {store: 'my-store', email : "roy@sudzy.co"} ],
        [{ key: 'number', val: 'testUpdateAndSave' }]).then((e) => {
            e.updateBucket('my-store', {email : "hbarr@sudzy.co", mobile: "6465490000"});
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testUpdateAndSave');
        }).then((es) => {
            if (es.length != 1 || _.keys(es[0].buckets).length != 1 || !es[0].buckets['my-store'].mobile) {
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
            e.removeSearchKey('number')
            return e.save();
        }).then((e) => {
            if (_.keys(e.search_keys_ref).legnth > 0) {
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
            e.addBucket('my-store', { b : "v"});
            return e.rollback();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddDecoratorAndRollback');
        }).then((es) => {
            if (es.length != 1 || _.values(es[0].buckets).length != 0) {
                throw new Error("entity was decorated")
            }
            return done();
        }).catch(_.noop);
    }    

    @test ("insert decorators and save")
    testAddManyDecoratorsAndSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, undefined).then((e) => {
            for(let i=0;i<5;i++) {
                e.addBucket('my-store' + i.toString(), { b : "testAddManyDecoratorsAndSave" + i.toString()});
                e.addSearchKey("v" + i.toString(), "testAddManyDecoratorsAndSave" + i.toString());
            }
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddManyDecoratorsAndSave1');
        }).then((es) => {
            if (es.length != 1 || _.values(es[0].buckets).length != 5) {
                throw new Error("entity was decorated")
            }
            return done();
        }).catch(_.noop);
    }    

    @test ("insert/update/remove decorators then save")
    testAddThenUpdate(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testAddThenUpdate"}]).then((e) => {
            for(let i=0;i<5;i++) {
                e.addBucket('my-store' + i.toString(), { b : "testAddThenUpdate" + i.toString()});
            }
            for(let i=0;i<5;i++) {
                e.updateBucket('my-store' + i.toString(), { b : "testAddThenUpdate11"});
            }
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey('testAddThenUpdate');
        }).then((es) => {
            if (es.length != 1 ||  _.values(es[0].buckets)[0].b != "testAddThenUpdate11") {
                throw new Error("entity was decorated")
            }
            return done();
        }).catch(_.noop);
    } 

    @test ("save and rollback and save results in same decorator ")
    testAddThenUpdateSeveralTimes(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testAddThenUpdateSeveralTimes"}]).then((e) => {
            e.addBucket('my-store', { b : "testAddThenUpdateSeveralTimes"});
            return e.save();
        }).then((e) => {
            e.updateBucket('my-store', { b : "testAddThenUpdateSeveralTimes1"});
            return e.rollback();
        }).then((e) => {
            e.updateBucket('my-store', { b : "testAddThenUpdateSeveralTimes2"});
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.getById(e.getId());
        }).then((e) => {
            return done();
        }).catch(_.noop);
    } 

    @test ("save and rollback results in same decorator ")
    testSaveAndRollback(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testAddThenUpdateSeveralTimes"}]).then((e) => {
            e.addBucket('my-store', { b : "testSaveAndRollback"});
            return e.save();
        }).then((e) => {
            e.updateBucket('my-store', { b : "testSaveAndRollback1"});
            return e.rollback();
        }).then((e) => {
            if (e.buckets['my-store'].b != "testSaveAndRollback") {
                throw new Error("my store was not rollback")
            }
            return done();
        }).catch(_.noop);
    } 

    @test ("rollback then save results in same decorator ")
    testRollbackTheSave(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testRollbackTheSave"}]).then((e) => {
            e.addBucket('my-store', { b : "testRollbackTheSave"});
            return e.rollback();
        }).then((e) => {
            e.updateBucket('my-store', { b : "testRollbackTheSave1"});
            return e.save();
        }).then((e) => {
            if (e.buckets['my-store'].b != "testRollbackTheSave1") {
                throw new Error("my store was not saved")
            }
            return done();
        }).catch(_.noop);
    } 

    @test ("add store less decorator")
    testStorelessDecorator(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testRollbackTheSave"}]).then((e) => {
            e.addBucket('', { b : "testRollbackTheSave"});
        }).then(_.noop).catch(() => done());
    }     

    @test ("add existing decorator should result in error")
    testAddExistingDecorator(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testAddExistingDecorator"}]).then((e) => {
            e.addBucket('my-store', { b : "testAddExistingDecorator"});
            return e.save();
        }).then((e) => {
            e.addBucket('my-store', { b : "testAddExistingDecorator"});
        }).then(_.noop).catch(() => done());
    }     

    @test ("update storeless decorator should result in error")
    testUpdateMissingDecorator(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testUpdateMissingDecorator"}]).then((e) => {
            e.addBucket('my-store', { b : "testUpdateMissingDecorator"});
            return e.save();
        }).then((e) => {
            e.updateBucket('no-store', { b : "testUpdateMissingDecorator"});
        }).then(_.noop).catch(() => done());
    }     

    @test ("update storeless decorator should result in error")
    testUpdateEmptyDecorator(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testUpdateMissingDecorator"}]).then((e) => {
            e.addBucket('my-store', { b : "testUpdateMissingDecorator"});
            return e.save();
        }).then((e) => {
            e.updateBucket('my-store', undefined);
        }).then(_.noop).catch(() => done());
    }     

    @test ("add and remove search key should do nothing")
    testAddThenRemoveSearchKey(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "v"}]).then((e) => {
            e.addSearchKey('b', "testAddThenRemoveSearchKey");
            e.removeSearchKey("b");
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey("testAddThenRemoveSearchKey");
        }).then((e) => {
            if (e.length) {
                throw new Error("key should not be saved");
            }
            done()
        });
    }     

    @test ("remove and add existing search key should do nothing")
    testRemoveThenAddExistingSearchKey(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testRemoveThenAddExistingSearchKey"}]).then((e) => {
            e.removeSearchKey('v');
            e.addSearchKey('v', "testRemoveThenAddExistingSearchKey");
            return e.save();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey("testRemoveThenAddExistingSearchKey");
        }).then((e) => {
            if (e.length != 1) {
                throw new Error("key should not be saved");
            }
            done()
        });
    }     

    @test ("remove and add existing search key should do nothing")
    testRemoveSearchThenRollback(done: Function) {
        EntityBaseTest.collection.insert({ a: "b" }, undefined, [{ key: "v", val: "testRemoveSearchThenRollback"}]).then((e) => {
            e.removeSearchKey('v');
            return e.rollback();
        }).then((e) => {
            return EntityBaseTest.collection.findByKey("testRemoveSearchThenRollback");
        }).then((e) => {
            if (e.length != 1) {
                throw new Error("key should not be removed");
            }
            done()
        });
    }     

}
