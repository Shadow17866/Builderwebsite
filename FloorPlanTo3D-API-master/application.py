import os
import PIL
import numpy


# from numpy.lib.function_base import average  # Removed - deprecated in newer numpy
from numpy import average


from numpy import zeros
from numpy import asarray

from mrcnn.config import Config

from mrcnn.model import MaskRCNN

from skimage.draw import polygon2mask
from skimage.io import imread

from datetime import datetime



from io import BytesIO
from mrcnn.utils import extract_bboxes
from numpy import expand_dims
from matplotlib import pyplot
from matplotlib.patches import Rectangle
from tensorflow.keras.backend import clear_session
import json
from flask import Flask, flash, request,jsonify, redirect, url_for
from werkzeug.utils import secure_filename

from skimage.io import imread
from mrcnn.model import mold_image

import tensorflow as tf
import sys

from PIL import Image
import requests




global _model
global _graph
global cfg
ROOT_DIR = os.path.abspath("./")
WEIGHTS_FOLDER = "./weights"

from flask_cors import CORS, cross_origin

sys.path.append(ROOT_DIR)

MODEL_NAME = "mask_rcnn_hq"
WEIGHTS_FILE_NAME = 'maskrcnn_15_epochs.h5'
WEIGHTS_URL = 'https://huggingface.co/mandeepaws2/weightfile/resolve/main/maskrcnn_15_epochs.h5'

def download_weights():
	"""Download model weights from Hugging Face if not present"""
	weights_path = os.path.join(WEIGHTS_FOLDER, WEIGHTS_FILE_NAME)
	
	if os.path.exists(weights_path):
		print(f"Weights file already exists at {weights_path}")
		return weights_path
	
	print(f"Downloading weights from Hugging Face...")
	os.makedirs(WEIGHTS_FOLDER, exist_ok=True)
	
	try:
		# Download using requests with streaming for large files
		response = requests.get(WEIGHTS_URL, stream=True)
		response.raise_for_status()
		
		total_size = int(response.headers.get('content-length', 0))
		print(f"Downloading {total_size / (1024*1024):.1f} MB...")
		
		with open(weights_path, 'wb') as f:
			for chunk in response.iter_content(chunk_size=8192):
				f.write(chunk)
		
		# Verify download
		if os.path.exists(weights_path) and os.path.getsize(weights_path) > 100000000:  # >100MB
			print(f"Successfully downloaded weights ({os.path.getsize(weights_path)} bytes)")
			return weights_path
		else:
			raise Exception("Download incomplete or file too small")
	except Exception as e:
		print(f"Error downloading weights: {e}")
		raise

application=Flask(__name__)
cors = CORS(application, resources={r"/*": {"origins": "*"}})
application.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size


class PredictionConfig(Config):
	# define the name of the configuration
	NAME = "floorPlan_cfg"
	# number of classes (background + door + wall + window)
	NUM_CLASSES = 1 + 3
	# Minimize GPU/memory usage
	GPU_COUNT = 1
	IMAGES_PER_GPU = 1
	
	# Reduce memory footprint
	BACKBONE = "resnet50"  # Smaller than resnet101
	
	# Balanced detection settings
	DETECTION_MIN_CONFIDENCE = 0.7
	DETECTION_MAX_INSTANCES = 50  # Reduced from 100
	
	# Reduce proposal settings to save memory
	POST_NMS_ROIS_TRAINING = 1000  # Reduced from 2000
	POST_NMS_ROIS_INFERENCE = 500  # Reduced from 1000
	RPN_NMS_THRESHOLD = 0.7
	DETECTION_NMS_THRESHOLD = 0.3
	
	# Reduce image resolution to save memory
	IMAGE_MIN_DIM = 512  # Reduced from 800
	IMAGE_MAX_DIM = 768  # Reduced from 1024
	IMAGE_RESIZE_MODE = "square"
	
	# Standard RPN settings
	RPN_ANCHOR_SCALES = (32, 64, 128, 256, 512)
	TRAIN_ROIS_PER_IMAGE = 100  # Reduced from 200

# Initialize model on startup
def load_model():
	global cfg
	global _model
	global _graph
	model_folder_path = os.path.abspath("./") + "/mrcnn"
	
	# Download weights if not present
	weights_path = download_weights()
	
	cfg=PredictionConfig()
	print(cfg.IMAGE_RESIZE_MODE)
	print('==============before loading model=========')
	_model = MaskRCNN(mode='inference', model_dir=model_folder_path,config=cfg)
	print('=================after loading model==============')
	_model.load_weights(weights_path, by_name=True)
	_graph = tf.get_default_graph()  # Needed for TF 1.15 with Flask threading


# Load model immediately
load_model()


def myImageLoader(imageInput):
	image =  numpy.asarray(imageInput)
	
	
	h,w,c=image.shape 
	if image.ndim != 3:
		image = skimage.color.gray2rgb(image)
		if image.shape[-1] == 4:
			image = image[..., :3]
	return image,w,h

def getClassNames(classIds):
	result=list()
	for classid in classIds:
		data={}
		if classid==1:
			data['name']='wall'
		if classid==2:
			data['name']='window'
		if classid==3:
			data['name']='door'
		result.append(data)	

	return result				
def normalizePoints(bbx,classNames):
	normalizingX=1
	normalizingY=1
	result=list()
	doorCount=0
	index=-1
	doorDifference=0
	for bb in bbx:
		index=index+1
		if(classNames[index]==3):
			doorCount=doorCount+1
			if(abs(bb[3]-bb[1])>abs(bb[2]-bb[0])):
				doorDifference=doorDifference+abs(bb[3]-bb[1])
			else:
				doorDifference=doorDifference+abs(bb[2]-bb[0])


		result.append([bb[0]*normalizingY,bb[1]*normalizingX,bb[2]*normalizingY,bb[3]*normalizingX])
	
	# Return average door size, or 0 if no doors detected
	averageDoor = (doorDifference / doorCount) if doorCount > 0 else 0
	return result, averageDoor	
		

def turnSubArraysToJson(objectsArr):
	result=list()
	for obj in objectsArr:
		data={}
		data['x1']=obj[1]
		data['y1']=obj[0]
		data['x2']=obj[3]
		data['y2']=obj[2]
		result.append(data)
	return result



@application.route('/',methods=['POST'])
def prediction():
	global cfg
	imagefile = PIL.Image.open(request.files['image'].stream).convert('RGB')
	image,w,h=myImageLoader(imagefile)
	print(h,w)
	scaled_image = mold_image(image, cfg)
	sample = expand_dims(scaled_image, 0)

	global _model
	global _graph
	with _graph.as_default():
		r = _model.detect(sample, verbose=0)[0]
	
	# Debug: print detection results
	print(f"Detected {len(r['rois'])} objects")
	print(f"Classes: {r['class_ids']}")
	print(f"Scores: {r['scores']}")
	
	#output_data = model_api(imagefile)
	
	data={}
	bbx=r['rois'].tolist()
	temp,averageDoor=normalizePoints(bbx,r['class_ids'])
	temp=turnSubArraysToJson(temp)
	data['points']=temp
	data['classes']=getClassNames(r['class_ids'])
	data['Width']=w
	data['Height']=h
	data['averageDoor']=averageDoor
	return jsonify(data)
		
    
if __name__ =='__main__':
	application.debug=True
	print('===========before running==========')
	application.run()
	print('===========after running==========')
