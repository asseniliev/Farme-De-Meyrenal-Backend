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
    leftToPay: req.body.totalAmount,
    payments: [],
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
//===================================================================================================
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

//===================================================================================================
// ROUTE http://localhost3000/orders/:id/payments
// Route to modify an order and add one or more payments
//===================================================================================================
router.put("/:id/payments", async (req, res) => {
  const id = req.params.id;
  const { paymentMethod, paymentDate, amount } = req.body;

  // Check that the required fields are present
  if (!paymentMethod || !paymentDate || !amount) {
    res.status(400).json({ error: 'Veuillez fournir un mode de paiement, une date de paiement et un montant.' });
    return;
  }

  try {
    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ error: 'Commande non trouvée.' });
      return;
    }

    // Calculer le montant restant à payer
    const remainingAmount = order.leftToPay - amount;
    // Ajouter le nouveau paiement à la commande
    const newPaiement = {
      paymentMethod,
      paymentDate: new Date(paymentDate),
      amount,
    };

    // Mettre à jour la commande avec le nouveau paiement
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $push: { payments: newPaiement },
        $set: { leftToPay: remainingAmount },
      },
      { new: true }
    );

    res.status(200).json({ message: 'Paiement ajouté avec succès.', order: updatedOrder });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la commande', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande.' });
  }
});

//===================================================================================================
// ROUTE http://localhost:3000/orders/:id/removePayments
// Remove all payments from an order
//===================================================================================================
router.delete('/:id/removePayments', async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      res.json({
        result: false,
        message: `Order ${orderId} not found`,
      });
      return;
    }

    order.payments = [];
    order.leftToPay = order.totalAmount;

    const updatedOrder = await order.save();

    res.json({
      result: true,
      order: updatedOrder._id,
      message: "All payments removed from the order",
    });
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
