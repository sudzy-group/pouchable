# @Pouchable
PouchDB empowered by TypeScript

<pre>
npm install pouchdb pouchable --save
</pre>

Include the followings in your project
<pre>
import { Entity, EntityField, Collection } from 'sudzy.db'
import * as PouchDB from 'pouchdb';
</pre>

Declare your Entity by using decortors!
<pre>
/**
 * Posts 
 */
class Post extends Entity {

    @EntityField({
        mandatory: true,
        group: "default",
        name: "title"
    })
    title: string;

    @EntityField({
        mandatory: false,
        group: "info",
        name: "author"
    })
    author: string;

    @EntityField({
        mandatory: false,
        group: "info",
        name: "content"
    })
    content: string;
}
</pre>

Declare your collections
<pre>
class Posts extends Collection<Post> {

    public getName(): string {
        return "posts";
    }

}

</pre>

You are ready to work with Pouchable:
<pre>
let db = new PouchDB("default");
let posts = new Posts(db, Post);

posts.insert({ title: "Pouchable is here!!!", author: "Joe"}).then((p) => {
   if (p.title != "Pouchable is here!!!") {
       throw new Error("not really hapenning...");
   }
   console.log(p.title);
}).catch(() => {});
</pre>







