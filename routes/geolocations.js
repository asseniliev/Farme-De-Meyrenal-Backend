var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/contours', async (req, res) => {
  const postalCode = "69500";
  const communityData = await (await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`)).json();
  const code = communityData[0].code;

  const geoData = await (await fetch(`https://geo.api.gouv.fr/communes?code=${code}&fields=nom,contour`)).json();


  const contour = geoData[0].contour.coordinates[0];
  const polygonCoords = [];

  for (const point of contour) {
    polygonCoords.push({
      latitude: point[1],
      longitude: point[0]
    });
  }

  res.json({ polygonCoords });
});

module.exports = router;
