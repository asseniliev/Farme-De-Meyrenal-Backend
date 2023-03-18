var express = require("express");
var router = express.Router();

var Region = require("../models/region");

/* GET home page. */
router.get("/contours", async (req, res) => {
  // const postalCode = "69500";
  // const communityData = await (
  //   await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`)
  // ).json();
  // const code = communityData[0].code;

  const regions = await Region.find();



  let latMin = Number.MAX_VALUE;
  let latMax = Number.MIN_VALUE;
  let lonMin = Number.MAX_VALUE;
  let lonMax = Number.MIN_VALUE;

  const regionsData = [];

  for (const region of regions) {

    //Fetch the region's boundary points
    const polygonCoords = [];
    const geoData = await (
      await fetch(
        `https://geo.api.gouv.fr/communes?code=${region.code}&fields=nom,contour,centre`
      )
    ).json();

    //Fill the region's contours
    const contour = geoData[0].contour.coordinates[0];

    for (const point of contour) {
      const lat = Number(point[1]);
      const lon = Number(point[0]);

      //Update latitude's and longitude's min and max values
      if (latMin > lat) latMin = lat;
      if (lonMin > lon) lonMin = lon;
      if (latMax < lat) latMax = lat;
      if (lonMax < lon) lonMax = lon;

      polygonCoords.push({
        latitude: point[1],
        longitude: point[0],
      });
    }

    let marketData = {};
    if (region.market.address) {
      marketData = {
        address: (region.name + ", " + region.market.address),
        latitude: region.market.latitude,
        longitude: region.market.longitude,
        label: region.market.label,
        marketHours: region.market.marketHours,
      }
    }

    regionsData.push({
      name: region.name,
      polygon: polygonCoords,
      //polygon: [],
      market: marketData,
      homeDeliveryHours: region.homeDeliveryHours
    });

  }

  const latInit = (latMin + latMax) / 2;
  const lonInit = (lonMin + lonMax) / 2;

  console.log(lonMin);

  res.json({
    regionsData: regionsData,
    latInit: latInit,
    lonInit: lonInit,
  });
});

router.get("/addressbycoordinates", async (req, res) => {
  //console.log("Lon = " + req.query.lon);
  const addresses = await (
    await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${req.query.lon}&lat=${req.query.lat}`
    )
  ).json();

  res.json({
    address: addresses.features[0].properties.label,
    city: addresses.features[0].properties.city,
  });
});

router.get("/addressbystring", async (req, res) => {
  const addresses = await (
    await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${req.query.q}&limit=1}`
    )
  ).json();

  if (addresses.features.length > 0) {
    res.json({
      result: true,
      address: addresses.features[0].properties.label,
      city: addresses.features[0].properties.city,
      location: addresses.features[0].geometry.coordinates,
    });
  } else {
    res.json({
      result: false,
    });
  }
});

module.exports = router;
