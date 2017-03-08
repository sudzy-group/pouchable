import { Repository } from './Repository';
import { suite, test, slow, timeout, skip, only } from "mocha-typescript";
import * as _ from 'lodash'

@suite class RepositoryTest {

    @test ("insert doc should return entity")
    testInsertDoc(done: Function) {
        let Posts = Repository.create("posts");
        Posts.new();
    }

}
