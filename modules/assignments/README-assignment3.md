# README-Assignment3 Report

# 22’ Spring CS380 Assignment #3: Let There Be Light

## Due: Tuesday, May 17th, 2022 (11:59 PM)

## Name: 심형주
## Student ID: 20200359
## Contact: adlet@kaist.ac.kr


# Basic Requirements (Due: May 17th)

## 1. Colored Illuminance

I've update `Light` class and `BlinnPhongShader.setUniform` function by adding rgb for each light.

I set it as a vec3 and use it when calculating final out_color in shader.

## 2. Point Light, and Spotlight Sources

I Update POINT branch and SPOTLIGHT branch in `main` function.

I implement soft border on SPOTLIGHT with sin interpolation.

Also, I set Slider for POINT and SPOTLIGHT's illuminance in my scene.

## 3. Materials

I set each Material's characteristic by implementing `Material` class in `modules/blinn_phong.js`, and `resources/blinn_phong.frag`.

`Material` Struct contains ambientColor, diffuseColor, specularColor, and isToonShading for Challenge.

I implement pipeline in `modules/blinn_phong.js` for sending `Material`  information.

I implement shader system making different rgb colors in `modules/blinn_phong.js` by ambientColor, diffuseColor, specularColor.

## 4. Creativity

I implement 2 new materials for this assignment. Bunny and Lighthouse.

I use bunny for many tests for each lights.

I use Lighthouse to shoot spotLight. I want to show spotLight rotating around Lighthouse.


## 1. Advanced keyframe-based 3D animation (ReImplemented)

I reimplement rotate function by using slerp function. (Quaternion smooth rotating)

Also, I make transform moving by make lerp function by own.

Those two functions are implemented in `animationMove` and `animationMove` function in `modules/assignments/assignment3.js`

## 2. ArcBall (ReImplemented)

I reimplement ArcBall from Trackball in assignment2.

Following function is in `modules/assignments/assignment3`, `arcBallUpdate`.

It save init rotation transform and multiple mouse rotation in rotation transform.

I can check route-independent action which is perspective of ArcBall.

It is implemented in all STEVE CHARACTER object and red cube object.

PRESS and DO NOT INPUT MOUSEUP EVENT WHILE ROTATING

## 3. Toon shading

I Implement toon shading in `resources/blinn_phong.frag`.

I set bool variable which detect current status by `isToonShading`.

It is send by pipeline in `Material` struct.

I use `ceil` function for cutting color, and `pow sin` for implementing outline, which make intensity to zero vector by detecting angle between light_vector and view_vector.

## Report

Thoroughly explain about your implementations of each requirements (or optionally, challenges.) TAs will *only* grade features you wrote on the report. Only .docx, .pdf, and .md formats are allowed. Include your report within your code directory.

## Code

Compress your project directory (+ report) given Python script `archive.py`. Running `python3 archive.py [Student ID]` will create a submission file for you. TAs will run your code *as-is* on Mozila Firefox, so double-check whether the submission file is working or not. Only .zip format is allowed.