var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/contours", async (req, res) => {
  // const postalCode = "69500";
  // const communityData = await (
  //   await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`)
  // ).json();
  // const code = communityData[0].code;

  const code = "07128";

  const geoData = await (
    await fetch(
      `https://geo.api.gouv.fr/communes?code=${code}&fields=nom,contour`
    )
  ).json();

  const contour = geoData[0].contour.coordinates[0];
  const polygonCoords = [];

  const firstPoint = contour[0];
  let latMin = Number(firstPoint[1]);
  let latMax = Number(firstPoint[1]);
  let lonMin = Number(firstPoint[0]);
  let lonMax = Number(firstPoint[0]);

  for (const point of contour) {
    const lat = Number(point[1]);
    const lon = Number(point[0]);

    if (latMin > lat) latMin = lat;
    if (lonMin > lon) lonMin = lon;
    if (latMax < lat) latMax = lat;
    if (lonMax < lon) lonMax = lon;

    polygonCoords.push({
      latitude: point[1],
      longitude: point[0],
    });
  }

  const latInit = (latMin + latMax) / 2;
  const lonInit = (lonMin + lonMax) / 2;
  // console.log("latInit = " + latInit);
  // console.log("lonInit = " + lonInit);

  res.json({ polygonCoords });
});

router.get("/addresses", async (req, res) => {
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

module.exports = router;
