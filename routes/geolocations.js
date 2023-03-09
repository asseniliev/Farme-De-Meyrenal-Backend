var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/contours", async (req, res) => {
  // const postalCode = "69500";
  // const communityData = await (
  //   await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`)
  // ).json();
  // const code = communityData[0].code;

  const codes = ["07128", "07197", "07188", "07013"];
  let latMin;
  let latMax;
  let lonMin;
  let lonMax;
  const polygons = [];
  const names = [];
  const latitudes = [];
  const longitudes = [];

  for (const code of codes) {
    const polygonCoords = [];
    const geoData = await (
      await fetch(
        `https://geo.api.gouv.fr/communes?code=${code}&fields=nom,contour,centre`
      )
    ).json();
    names.push(geoData[0].nom);
    const lat = Number(geoData[0].centre.coordinates[1]);
    latitudes.push(lat);
    const lon = Number(geoData[0].centre.coordinates[0]);
    longitudes.push(lon);
    const contour = geoData[0].contour.coordinates[0];
    for (const point of contour) {
      const lat = Number(point[1]);
      const lon = Number(point[0]);
      if (latMin) {
        if (latMin > lat) latMin = lat;
      } else {
        latMin = lat;
      }
      if (lonMin) {
        if (lonMin > lon) lonMin = lon;
      } else {
        lonMin = lon;
      }
      if (latMax) {
        if (latMax < lat) latMax = lat;
      } else {
        latMax = lat;
      }
      if (lonMax) {
        if (lonMax < lon) lonMax = lon;
      } else {
        lonMax = lon;
      }
      polygonCoords.push({
        latitude: point[1],
        longitude: point[0],
      });
    }
    polygons.push(polygonCoords);
  }

  const latInit = (latMin + latMax) / 2;
  const lonInit = (lonMin + lonMax) / 2;
  // console.log("latInit = " + latInit);
  // console.log("lonInit = " + lonInit);

  console.log(latitudes);
  res.json({
    polygons: polygons,
    names: names,
    latitudes: latitudes,
    longitudes: longitudes,
    latInit: latInit,
    lonInit: lonInit,
  });
});

//   for(const code of codes){

//   const contour = geoData[0].contour.coordinates[0];
//   console.log(contour);
//   for (const point of contour) {
//     const lat = Number(point[1]);
//     const lon = Number(point[0]);

//     if (latMin) {
//       if (latMin > lat) latMin = lat;
//     } else {
//       latMin = lat;
//     }
//     if (lonMin) {
//       if (lonMin > lon) lonMin = lon;
//     } else {
//       lonMin = lon;
//     }
//     if (latMax) {
//       if (latMax < lat) latMax = lat;
//     } else {
//       latMax = lat;
//     }
//     if (lonMax) {
//       if (lonMax < lon) lonMax = lon;
//     } else {
//       lonMax = lon;
//     }

//     polygonCoords.push({
//       latitude: point[1],
//       longitude: point[0],
//     });
//   }}

//   const latInit = (latMin + latMax) / 2;
//   const lonInit = (lonMin + lonMax) / 2;
//   // console.log("latInit = " + latInit);
//   // console.log("lonInit = " + lonInit);

//   res.json({ polygonCoords });
// }

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
