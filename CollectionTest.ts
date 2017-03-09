import { EntityField } from './EntityField';
import { Entity } from './Entity';
import { EntityBase } from './EntityBase';
import { Collection } from './Collection';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import * as PouchDB from 'pouchdb';
import * as _ from 'lodash';

@suite class CollectionTest {

    static db_name;
    static db;

    static before() {
        CollectionTest.db_name = 'CollectionTest' + Math.random();
        CollectionTest.db = new PouchDB(CollectionTest.db_name);
    }

    static after(done) {
        CollectionTest.db.destroy().then(() => {
            done();
        }).catch(function (err) {
          console.log(err);
        });
    }

    @test ("insert doc should return entity")
    testInsertDoc(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        posts.insert({ title: "New One"}).then((p) => {
            if (p.title != "New One") {
                throw new Error("missing data");
            }
            done();
        }).catch(_.noop);
    }

    @test ("missing mandatory insert doc should return failure")
    testInsertErrorCore(done: Function) {
        let posts = new Posts(CollectionTest.db, Post);
        posts.insert({ missing : "key"}).then(_.noop)
        .catch(() => done());
    }

    @test ("insert doc should return entity")
    testInsertDocCore(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490560"}).then((p) => {
            done();
        }).catch(_.noop);
    }

    @test ("too many fields in mandatory should return failure")
    testInsertErrorToMannyCore(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({ name: "New One", mobile : "6465490560", bla: "Bla"}).then(_.noop).catch(() => done());
    }    

    @test ("missing mandatory should return failure")
    testInsertErrorMissingCore(done: Function) {
        let users = new Users(CollectionTest.db, User);
        users.insert({  mobile : "6465490560" }).then(_.noop).catch(() => done());
    }    

}

/**
 * Posts example
 */
class Post extends Entity {

    @EntityField({
        mandatory: true,
        group: "default",
        name: "title"
    })
    title: string;

}

class Posts extends Collection<Post> {
    
    public getName(): string {
        return "posts";
    }

}

/**
 * Users example
 */
class User extends Entity {

    @EntityField({
        mandatory: true,
        group: "default",
        name: "mobile",
        search_by: ["lastFourDigits", _.identity]
    })
    mobile: string;

    @EntityField({
        mandatory: true,
        group: "default",
        name: "name"
    })
    name: string;

    @EntityField({
        mandatory: false,
        group: "address",
        name: "street",
        description: "User's street"
    })
    street: string;

    protected lastFourDigits(mobile) {
        return mobile.substr(-4);
    }

}

class Users extends Collection<User> {
    
    public getName(): string {
        return "users";
    }

}

