var express = require("express");
var router = express.Router();
const { ObjectId } = require("mongodb");
const Order = require("../models/order");

//===================================================================================================
// ROUTE http://localhost:3000/orders/:id/status
// body {"status": "delivered"}
// Search for the order by ID and replace the order status. 
// Three possible statuses: "created" "confirmed" or "delivered".
//===================================================================================================
router.put('/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const newStatus = req.body.status;

  // Check if the new status is valid
  if (!["created", "confirmed", "delivered"].includes(newStatus)) {
    res.json({
      result: false,
      message: "Invalid status. Allowed values: created, confirmed, delivered",
    });
    return;
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: orderId },
      { status: newStatus },
      { new: true }
    );

    if (updatedOrder) {
      res.json({
        result: true,
        order: updatedOrder._id,
        status: updatedOrder.status,
      });
    } else {
      res.json({
        result: false,
        message: `Order ${orderId} not found`,
      });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/orders/:id/isCancelled
// Search for the order by ID and switch "isCancelled" to true
//===================================================================================================
router.put('/:id/isCancelled', async (req, res) => {
  const orderId = req.params.id;
    try {
    const updatedOrder = await Order.findByIdAndUpdate(
      { _id: orderId },
      { isCancelled: true, status: "" },
      { new: true },
    );
    if (updatedOrder) {
      res.json({
        result: true,
        order: updatedOrder._id,
        isCancelled: updatedOrder.isCancelled,
        status: updatedOrder.status,
      });
    } else {
      res.json({
        result: false,
        message: `Order ${orderId} not found`,
      });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/orders
// Create a new  order
// 1. Construct the new order's number
// 2. Create the new order
// 3. Check if the new order was successfully created and return the result
//===================================================================================================
router.post("/", async (req, res) => {
  // incoming data
  // req.body.id  - user id
  // req.body.city - the user's city
  // req.body.items - the order items structure: {
  //    productId: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
  //    title: String,
  //    quantity: Number,
  //    price: Number,
  //    priceUnit: String,
  //  }
  // req.body.totalAmount

  // 1. Construct the new order's number
  const orderNumber = (await getLastNumber()) + 1;

  // 2. Create the new order
  const newOrder = new Order({
    orderNumber: orderNumber,
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

    // 3. Check if the new order was well created
    if (
      createdOrder.items.length === newOrder.items.length &&
      createdOrder.totalAmount === newOrder.totalAmount
    ) {
      res.json({
        result: true,
        order: createdOrder.orderNumber,
      });
    } else {
      res.json({
        result: false,
        message: "Something went wrong. Order not created",
      });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});



//===================================================================================================
// ROUTE http://localhost:3000/orders/{id}
// Get an order by ID
//===================================================================================================
router.get("/:id", async (req, res) => {
  // router.get("/findOne/:id", async (req, res) => {
  // Incoming data:
  // req.params.id  - the order id

  try {
    const result = await Order.findById(req.params.id);
    res.json({ result: result });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/orders
// Filter orders (by users, by delivery region, by status)
// Exemple por tester route: localhost:3000/orders/?user=6415d5b0fae91ef10621dd48&status=confirmed&deliveryPlace=Quintenas
//
router.get("/", async (req, res) => {
  // router.get("/filter", async (req, res) => {
  // incoming data:
  // req.query.user - the user who created the order
  // req.query.deliveryPlace - the city where order must be delivered
  // req.query.status - the status of the odrer

  const userId = req.query.user;
  const city = req.query.deliveryPlace;
  const status = req.query.status;

  const filter = {};
  if (userId) filter.user = userId;
  if (city) filter.city = city;
  if (status) filter.status = status;

  try {
    const result = await Order.find(filter)
      .populate("user")
      .populate("items.productId");
    if (result.length === 0)
      res.json({ result: false, message: "No orders match your search." });
    else {
      res.json({ result: result });
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});


async function getLastNumber() {
  const result = await Order.aggregate([
    {
      $group: {
        _id: null,
        maxNumber: { $max: "$orderNumber" },
      },
    },
  ]);

  return result[0].maxNumber;
}

module.exports = router;
