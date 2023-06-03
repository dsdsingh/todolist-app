//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database connection //
mongoose.connect('mongodb+srv://hanushi:urPu4Z1FAS0S6dXi@cluster0.aqh88ph.mongodb.net/todolistDB');

const itemsSchema = {
  name: {
    type: String,
    required: true
  }
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<= Hit this to delete an item"
})

const defualtItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find().then(function (foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defualtItems).then(function (docs) {
        console.log("Items saved")
      }).catch(function (err) {
        console.log(err);
      });
      res.redirect("/")
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
});


// Adding new items in root route and others dynamic route
app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listTitle = req.body.list;
  const newItem = new Item({
    name: itemName
  });

  if (listTitle === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }).then(function (docs) {
      docs.items.push(newItem);
      docs.save();
    });
    res.redirect("/" + listTitle);
  }

});


// Deleting checked items from root route and other dynamic route
app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID).then(function (docs) {
      console.log("One item deleted");
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemID}}}).then(function(){
      res.redirect("/" + listName);
    })
  }

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then(function (docs) {
    if (!docs) {  // Creating new list
      const list = new List({
        name: customListName,
        items: defualtItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else { // show existing list
      res.render("list", { listTitle: docs.name, newListItems: docs.items })
    }
  });

});

// app.get("/about", function (req, res) {
//   res.render("about");
// });

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port , function () {
  console.log("Server started on port 3000");
});
