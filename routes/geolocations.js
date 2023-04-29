var express = require("express");
var router = express.Router();

var Region = require("../models/region");



//===================================================================================================
// ROUTE http://localhost:3000/locations/contours
// For each region found in the regions collections fetches data from geo.api.gouv.fr API 
// and gets information about the region’s contour. Also collects data immediately from 
// the documents in the collection and sends it to the frontend. Used in the AddressScreen.js 
// to display information about the regions where Flavien delivers and also market information.
//===================================================================================================
router.get("/contours", async (req, res) => {
  const regions = await Region.find();
  // incoming data: none

  // The variables below will contain the min and max values for the
  // altitudes and longitudes of all selected regions.
  // Used to determine the center of the regions and locate the map 
  // in this center
  let latMin = Number.MAX_VALUE;
  let latMax = Number.MIN_VALUE;
  let lonMin = Number.MAX_VALUE;
  let lonMax = Number.MIN_VALUE;

  const regionsData = [];

  for (const region of regions) {

    // Fetch the region's boundary points
    // !!! Attention !!!
    // the variable 'region.code' IS NOT the commune's postal code
    // To find that code, we can use the postal code (which we normally know)
    // and fetch https://geo.api.gouv.fr/communes?codePostal=${postalCode}
    // The database contains immediately the commune's code that we need -> therefore
    // we don't need to fetch via the postal code.

    const polygonCoords = [];
    const geoData = await (
      await fetch(
        `https://geo.api.gouv.fr/communes?code=${region.code}&fields=nom,contour`
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

    // Populate the market data frmo the database only
    // if there is a sub-document containing such data
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

    // Construct the data for the region
    regionsData.push({
      name: region.name,
      polygon: polygonCoords,
      //polygon: [],
      market: marketData,
      homeDeliveryHours: region.homeDeliveryHours
    });

  }

  // Calculate the center of the map
  const latInit = (latMin + latMax) / 2;
  const lonInit = (lonMin + lonMax) / 2;
  let latDelta = (Math.abs(latMax - latMin) + 0.05);
  let lonDelta = Math.abs(lonMax - lonMin + 0.05);
  latDelta = Math.round(latDelta * 100) / 100;
  lonDelta = Math.round(lonDelta * 100) / 100;

  res.json({
    regionsData: regionsData,
    latInit: latInit,
    lonInit: lonInit,
    latDelta: latDelta,
    lonDelta: lonDelta
  });
});


//===================================================================================================
// ROUTE http://localhost:3000/locations/addressbycoordinates    (Address-By-Coordinates)
// Fetches data from api-adresse.data.gouv.fr service based on point's latitude and longitude. 
// Used in AddressScreen.js to retrive the address when using the geolocalizer
//===================================================================================================
router.get("/addressbycoordinates", async (req, res) => {
  //incoming data:
  //req.query.lat -> point's geogtaphical latitude
  //req.query.lon -> point's geogtaphical longitude

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

//===================================================================================================
// ROUTE http://localhost:3000/locations/addressbystring     (Address-By-String)
// Fetches data from api-adresse.data.gouv.fr service based on an address search string. 
// Used in AddressScreen.js to retrive the address when entry is manually made in the address field
//===================================================================================================
router.get("/addressbystring", async (req, res) => {
  //incoming data:
  //req.query.q -> a string that is part of the address

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
