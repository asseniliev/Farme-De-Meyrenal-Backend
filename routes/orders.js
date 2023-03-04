var express = require("express");
var router = express.Router();
const { ObjectId } = require("mongodb");
const Order = require("../models/order");

//User create new order
router.post("/", async (req, res) => {
  const newOrder = new Order({
    user: req.body.id,
    city: req.body.city,
    date: Date.now(),
    items: req.body.items,
    totalAmount: req.body.totalAmount,
    status: "created",
    isPaid: false,
    isCancelled: false,
  });
  try {
    const createdOrder = await newOrder.save();

    if (
      createdOrder.items.length === newOrder.items.length &&
      createdOrder.totalAmount === newOrder.totalAmount
    ) {
      res.json({
        result: true,
        message: "Order created",
      });
    } else {
      res.json({
        result: false,
        message: "Something went wrong. Order not created",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Search order by ID
router.get("/findOne/:id", async (req, res) => {
  try {
    const result = await Order.findById(req.params.id);
    res.json({ result: result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
//
//Filter orders (by users, by delivery region, by status)
// Exemple por tester route: localhost:3000/orders/filter?userId=63ff2c235a4f4ccacaf25fad&status=confirmed&deliveryPlace=Bron
// 
router.get("/filter", async (req, res) => {
  const userId = req.query.userId;
  const city = req.query.deliveryPlace;
  const status = req.query.status;

  const filter = {
    $and: [
      userId ? { user: userId } : {},
      city ? { city } : {},
      status ? { status } : {},
    ],
  };
  try {
    const result = await Order.find(filter);
    if (result.length === 0) res.json({ result: false, message: 'No orders match your search.' })
    else res.json({ result: result });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
