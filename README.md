
# Famme's BDO Tools

### somethinglovely.net by Famme (Discord: fffam)

An interactive map for Black Desert Online. The website has been sunset as a result of not being in a position to stay current with game updates.

Horses, crates & tradepack tools are just embeds for the following jsfiddle pages:

* **Horse Calculator:** https://jsfiddle.net/fffam/k5z99cus/embedded/result/
* **Crate Calculator:** https://jsfiddle.net/fffam/8Ldoz5wz/embedded/result/
* **Tradepack Reference:** https://jsfiddle.net/fffam/pL6us4kd/embedded/result/

All code & original assets are to be considered MIT-licensed (images within `horses` & `icons` are copyright Pearl Abyss Corp). You may use any of the code, or rehost the website in its entirety.

<hr>

## Installation

* Download the map tiles https://mega.nz/file/ThJA3BRD#KD-6R8Lm8d9MRZsl21BSe2HMrlpi72B9iMIKcRsoTs8 (100MB)
* Host map tiles somewhere.
* Clone repo
* `npm install`
* Search project for somethinglovely.net and replace with your own path to where your map tiles are being served from
* If serving to the public, put it behind a cache (CloudFlare free tier works fine).

To run locally:

* `gulp`

To build (into dist folder):

* `gulp build`

## Updating data

The data is all in [data.json](src/data.json). Nodes are listed in custom object format, all other layers are in standard GeoJSON FeatureCollection format. Should all be pretty obvious once prettified.

## Updating map tiles

https://mega.nz/file/7t5yBTpb#kG8wK4gp6JKZf4W-qreqPQ8l9m0RdaowxDHBLk0rV8o (3.9GB) and https://mega.nz/file/b4pz3CBD#Fr9EWgL77kpCe2Iteai0lZhuS36YTJKaUt1NLw5f0BI (58KB).

#### Time estimates:

* 5 mins work
* 1 hour wait to extract tiles
* 10 mins work (more if you need to install WSL/bash)
* 6 hour wait to convert to giant singular map png
* 30 mins to combine in photoshop
* 2 hour to split into leaflet tiles

#### Steps:

1. Download latest PAZ files (i.e. just patch game)
2. Get paz_browser from BDO Data/PazExtractor and put it in BDO paz folder
3. Run it and Search > mapdata_realexplore then extract mapdata_realexplore.xml and mapdata_realexplore2.xml
4. Run it and extract `rader*.dds` (search `rader*.dds`, then press A to select all)
5. Wait for extraction to finish (ETA: 60 minutes, set an alert)
6. Put all of the dds map tiles into a folder called 'rader'
7. Copy the 5 radar script files (radar-combine.sh, radar-combine-fast.sh, radar-convert.sh, radar-getbounds.js and radar-sort.js) into the folder above 'rader'
8. In linux (probably WSL - https://docs.microsoft.com/en-us/windows/wsl/install-win10), make sure imagemagick is installed (sudo apt-get update followed by sudo apt-get install imagemagick)
9. Increase the width/height/disk/memory limits in the ImageMagick policy.xml (probably in /etc/ImageMagick-6/). Change width/height from 16KP to 256KP. Change Memory from 256MiB to 16GiB. Change Disk to 16GiB.

10. Create the empty folders alongside rader:
* rader-sorted
* rader-slices

11. Put the blank.png in the same folder as radar-sort.sh

12. In bash, run the scripts in the following order (or chain execute them with &&):  
`radar-convert.sh` (converts the dds texture files to png. ETA: 20m)  
`radar-sort.sh` (copies the png tiles to a folder with new names that are 0-indexed.) ETA: 30m)  
`radar-combine-fast.sh` (uses imagemagick's montage to stitch the tiles together. ETA: 4 hours, run it overnight)  
**NOTES:**  
radar-getbounds.js is just to check the map grid bounds  
radar-combine-fast.sh is slow, but its just faster than the other version because it combines the tiles in strips as an intermediate step

13. Open Map (Combined).psb in photoshop

14. With the `map_{DATE}` layer selected, go Layer > Smart Objects > Relink to File and select the new map.png that was created from step 11. The original linked image path will probably be broken by default.

15. Adjust the layer mask for the `map` layer, and for the Ocean Overlay layer to make the map look good. Then save the file (Ctrl-S), then also export the file as a 100% JPEG (File > Save a Copy... > Select JPEG) and save as map.jpg

16. Run the slicer script to convert to leaflet map tiles:  
`./magick-slicer.sh map.jpg`

17. [OPTIONAL BUT ADVISED] Once sliced, optimise the filesizes of the tiles (using ImageOptim on OSX or an equivalent tool on Linux/Win)  
`find ./Map_files -type f -iname \*jpg -print0 | xargs -0 -t -n 100 /Applications/ImageOptim\ 2.app/Contents/MacOS/ImageOptim`

18. compress the files into a tarball  
`mv ./Map_files tiles-new`  
`tar -zcvf tiles-new.tar.gz tiles-new`

19. Upload tarbarll to server, then ssh into server and unpack the tarball  
`scp tiles-new.tar.gz username@somethinglovely.net:/home/www/somethinglovely.net/bdo`  
`tar xzvf tiles-new.tar.gz`

20. swap the old tiles for the new ones  
`mv tiles2 tiles2-old && mv tiles-new tiles2`