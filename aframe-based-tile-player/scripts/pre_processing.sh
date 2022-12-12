#!/bin/bash -e
############################################################
# VR-DASH-TILE-PLAYER PRE-PROCESSING                       #
############################################################

opts=$(getopt \
    --options "i:w:h:" \
    -- "$@"
)

############################################################
# Help                                                     #
############################################################
Help()
{
   echo "This script do the pre-process required to use the video into the VR-DASH-TILE-PLAYER"
   echo
   echo "Syntax: $0 [<ARGS>] "
   echo
   echo "ARGS:"
   echo -e "\t Mandatory:"
   echo -e "\t\t -i \"<VIDEO MP4>\""
   echo -e "\t\t -w \"<VIDEO WIDTH>\""
   echo -e "\t\t -h \"<VIDEO HEIGHT>\""

}

############################################################
# Main program                                             #
############################################################
set +H
#set -e

echo "[INFO] VR-DASH-TILE-PLAYER PRE-PROCESSING : Execution Started"

scriptDir="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
resultDir="results/"

eval set --$opts

while true; do
   case "$1" in
      -i) paramI="$2" ; shift 2 ;;
      -w) paramW="$2" ; shift 2 ;;
      -h) paramH="$2" ; shift 2 ;;
      --) shift; break;;
      *) Help ; break;;
   esac
done


echo "Initializing the process..."
echo "[INFO] Converting Equirectangular Projection to Cube Mapping Projection"
#ffmpeg -i The_Guitar_Man.mp4 -vf v360=e:c3x2:cubic:w=1920:h=1080:out_pad=0 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 CMP_The_Guitar_Man.mp4

echo $paramI
echo $paramW
echo $paramH
echo $scriptDir
echo $((paramW/paramH))

for ((i=0;i<6;i++));
do
    mkdir -p ./face$i/
echo $i
done

# ffmpeg -y -i CMP_The_Guitar_Man.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=0*(in_w/3):y=0*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face0/face0.mp4


# ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=0*(in_w/3):y=0*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face0.mp4
# ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=1*(in_w/3):y=0*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face1.mp4
# ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=2*(in_w/3):y=0*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face2.mp4
# ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=0*(in_w/3):y=1*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face3.mp4
# ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=1*(in_w/3):y=1*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face4.mp4
# ffmpeg -y -i CMP_video.mp4 -vf "crop=w=in_w/3:h=in_h/2:x=2*(in_w/3):y=1*(in_h/2)" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face5.mp4


############################################################
# SLICE FACES INTO INDIVIDUAL VIDEOS                       #
############################################################

for ((y=0, face=0;y<=1;y++));
do
    for ((x=0;x<=2;x++, face++));
    do
        echo "[INFO] Now slicing face $face..."

        vfParam="crop=w=in_w/3:h=in_h/2:x=$x*(in_w/3):y=$y*(in_h/2)"
        ffmpeg -y -i $paramI -vf "$vfParam" -c:v libvpx-vp9 -keyint_min 30 -g 30 -sc_threshold 0 -an face$face/face$face.mp4
        
        echo "[DONE] Slicing face $face!"
    done
done


echo "Done"