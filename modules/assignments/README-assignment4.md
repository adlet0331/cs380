# 22' Spring CS380 Assignment #4: Virtual Photo Booth (Final Project)

## Due: Tuesday, June 7th, 2022 (11:59 PM)

## Name: 심형주
## Student ID: 20200359
## Contact: adlet@kaist.ac.kr

# Basic Requirements

## 1. Reuse HW1: Animated background (1pt)
I reuse Assignment1 class to implement animated background.

## 2. Reuse HW2: Avatar with adjustable pose (0.5pt)
I reuse functions in Assignment2 to contruct my avatar and posing. 

## 3. Reuse HW3: Blinn-Phong lightings (1pt)

I reuse Blinn-Phong shader for lightings and light objects in scene. I construct light objects and I can control my lighting objects' sources in slider in webpage.

## 4. Skybox (0.5pt)
I implement skybox for free-skybox image which I capture in game Minecraft.

Little bit of crack might be seen, so i put Remark right bottom of my minecraft skybox code. If some of crack is been deducted point, I wish bottom image can help my score (...)

## 5. Camera effects (2pt)
I implement few camera effects

Following effects are which I implemented.

- Color inversion (0.5pt)
- Grayscale (0.5pt)
- Blurring (1pt)
- Fish-eye (1pt)
- Chromatic aberration (1pt)

## 6. Creativity (1pt)

Briefly write down on your report in which part your creativity is shown.
It can be the interesting choice of the objects or animation.
Any artistic aspects of your assignment should be written here.
(Any technical aspects should be written in basic requirements or challenges.)

## Specifications and Points

| Specification                             | Point |
| ----------------------------------------- | ----- |
| 1. Reuse HW1: Animated background         | 1     |
| 2. Reuse HW2: Avatar with adjustable pose | 0.5   |
| 3. Reuse HW3: Blinn-Phong lightings       | 1     |
| 4. Skybox                                 | 0.5   |
| 5. Camera Effects                         | 2     |
| 6. Creativity                             | 1     |
| Total                                     | 6     |

# Challenges

Note: Challenges are _optional_, but you should gather **7 points** from challenges to get the full score at the end of the term project.
For more detailed description, please refer to the term project introduction slides.
Listed challenges are TA-recommended challenges which are helpful for the current assignment and the whole project.

- This is the final assignment. Don't forget to submit your challenge tasks ! You have to earn 7 challenge points to get full score!

- Challenges that have already earned challenge points in previous assignments do not need to be resubmitted.

- This time, some challenge lists overlap with some basic requirements. Please note that the functions that earned basic requirements points is not counted for the challenge points.

## 0. Previous challenge lists

- Assignment #1
    - Keyframe-based 2D animation (1pt)
- Assignment #2
    - Advanced keyframe-based 3D animation (1pt)
    - Arcball (2pt)
- Assignment #3
    - Perlin noise (2pt)
    - Toon shading (1pt)

## 1. Bump map
We already offered the code for computing tangent in 'modules/cs380/mesh.js'. If you build your mesh with the function buildMesh(mesh, data, **buildTangent = true**), tangent information is also saved to your mesh. Exploit tangent values, you can generate bump map. Please refer to your textbook 387 page for the implentation.

Reference: textbook 387p.

wiki: https://en.wikipedia.org/wiki/Bump_mapping#Methods

## 2. Fish-eye
wiki: https://en.wikipedia.org/wiki/Fisheye_lens#Mapping_function
## 3. Chromatic aberration
wiki: https://en.wikipedia.org/wiki/Chromatic_aberration

## 4. Depth of field
Reference: textbook 404p.

wiki: https://en.wikipedia.org/wiki/Depth_of_field

## 5. Motion blur
Reference: textbook 404p.

wiki: https://en.wikipedia.org/wiki/Motion_blur#Computer_graphics

## 6. Shadow map with directional light
Reference: textbook 300p.

## 7. Screen space ambient occlusion
wiki: https://en.wikipedia.org/wiki/Screen_space_ambient_occlusion

opengl resource: https://learnopengl.com/Advanced-Lighting/SSAO

## 8. Screen space reflection
https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html


| Challenge                     | Point |
| ----------------------------- | ----- |
| 1. Bump map                   | 1     | 
| 2. Fish-eye                   | 1     | 
| 3. Chromatic aberration       | 1     |
| 4. Depth of field             | 2     |
| 5. Motion blur                | 2     |
| 6. Shadow map                 | 2     |
| 7. Screen space ambient occlusion          | 3     |
| 8. Screen space reflection    | 3     |

## Make-your-own challenge

Other than listed challenges above, you may declare your own challenges on your report.
They must have a significant technical challenges to get the point, and if so TAs will grant challenge points by the similar criteria used for listed challenges. If you want to check whether your own challenge could be counted for challenge points, come to office hour session before submission.

# Deliverables

## Report

**TAs will _only_ grade features you wrote on the report.**

Thoroughly explain about your implementations of each requirements and challenges.
Only .docx, .pdf, and .md formats are allowed.
Include your report within your code directory.

## Code

Compress your project directory (+ report) given Python script `archive.py`.
Running `python3 archive.py [Student ID]` will create a submission file for you.
TAs will run your code _as-is_ on Mozila Firefox, so double-check whether the submission file is working or not.
Only .zip format is allowed.
