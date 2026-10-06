# Sources, attribution and publication permissions

## CSSDM

CSSDM research project, experiment 20261004. Five calibrated 20261004 family-background model outputs were averaged, then thresholded by species against eBird. No new model fitting was performed for this website. The site displays derived binary predictions, not occurrence observations or ground-truth occupancy. Source model and iNaturalist-derived data remain subject to their respective terms; this package does not grant new rights to them.

## eBird Status and Trends

Fink, D., T. Auer, A. Johnston, M. Strimas-Mackey, S. Ligocki, O. Robinson, W. Hochachka, L. Jaromczyk, C. Crowley, K. Dunham, A. Stillman, C. Davis, M. Stokowski, P. Sharma, V. Pantoja, D. Burgin, P. Crowe, M. Bell, S. Ray, I. Davies, V. Ruiz-Gutierrez, C. Wood, A. Rodewald. 2024. eBird Status and Trends, Data Version: 2023; Released: 2025. Cornell Lab of Ornithology, Ithaca, New York. https://doi.org/10.2173/WZTW8903

- Project: https://science.ebird.org/en/status-and-trends
- Recommended citation: https://science.ebird.org/en/status-and-trends/recommended-citation
- Terms: https://science.ebird.org/en/status-and-trends/products-access-terms-of-use

The source products are 2023 mean-abundance rasters from the project's existing authorized downloads. The original raster period (full_year or resident) and species code are recorded in `data/species.json` and shown in the viewer. This viewer converts positive abundance to presence and finite zero abundance to absence. It does not display abundance magnitude. Missing values remain visibly distinct from zero.

This material uses data from the eBird Status and Trends Project at the Cornell Lab of Ornithology, eBird.org. Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the Cornell Lab of Ornithology.

### Confirm permission before publishing

This is a local deployment-ready package, not evidence of publication permission. Section 3(d) of the eBird Status and Trends terms requires prior written permission for use/redistribution of data products and modified data products in websites or web visualization tools. Binary maps derived from abundance are modified products. Before uploading the data into a public GitHub repository or enabling Pages, confirm that your Cornell/eBird permission explicitly covers this public website and all included species. Attribution alone is not a substitute for that permission. No such permission was verified or obtained during preparation of this package.

## Mapping components

- OpenLayers 10.10.0: BSD-2-Clause; see `vendor/OPENLAYERS-LICENSE.md`.
- proj4js 2.20.9: MIT; see `vendor/PROJ4-LICENSE.md`.
- County outlines: reused from the CSSDM project's Florida county boundary data (67 counties, simplified for display). Data filtering uses the original, unsimplified county polygons.
- Optional street tiles: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright. Attribution is displayed on the maps when enabled. Street tiles are not bundled and are off by default.

The application works without an external JavaScript CDN. Optional street tiles require internet access; the bird distributions and county outlines do not depend on those tiles.

