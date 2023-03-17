var express = require("express");
var router = express.Router();
const { ObjectId } = require("mongodb");
const Order = require("../models/order");

//User create new order
router.post("/", async (req, res) => {
  const orderNumber = (await getLastNumber()) + 1;
  console.log("Order No. " + orderNumber);
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

  console.log(newOrder);

  try {
    const createdOrder = await newOrder.save();

    if (
      createdOrder.items.length === newOrder.items.length &&
      createdOrder.totalAmount === newOrder.totalAmount
    ) {
      res.json({
        result: true,
        order: createdOrder.orderNumber,
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
// Exemple por tester route: localhost:3000/orders/filter?id=63ff2c235a4f4ccacaf25fad&status=confirmed&deliveryPlace=Bron
//
router.get("/filter", async (req, res) => {
  const userId = req.query.user;
  const city = req.query.deliveryPlace;
  const status = req.query.status;

  // const filter = {
  //   $and: [
  //     userId ? { user: userId } : {},
  //     city ? { city } : {},
  //     status ? { status } : {},
  //   ],
  // };
  const filter = {};
  if (userId) filter.user = userId;
  if (city) filter.city = city;
  if (status) filter.status = status;

  try {
    const result = await Order.find(filter).populate('user');
    if (result.length === 0)
      res.json({ result: false, message: "No orders match your search." });
    else res.json({ result: result });
  } catch (error) {
    console.error(error);
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
  // .toArray(function (err, result) {
  //   if (err) throw err;
  //   console.log(result[0].maxNumber);
  //   res.json({ result: result[0].maxNumber });
  // });
}

module.exports = router;
