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
I implement few camera effects. These camera effects are in webpage's selecting UI.

I implement camera effects by changing uniforms of each material. 

Those camera effects are in my_shader.frag

Following effects are which I implemented.

- Color inversion (0.5pt)

I implement color inversion by subtracting origin rgb from vec3(1.0, 1.0, 1.0).

- Grayscale (0.5pt)

I implement grayscale by changing rgb to gray color by using some Formula which change rgb to gray color.

- Blurring (1pt)

I use $\frac{1}{9}* \begin{bmatrix}1&1&1\\1&1&1\\1&1&1\\\end{bmatrix}$ for blurring matrix.

- Fish-eye (1pt)

- Chromatic aberration (1pt)

## 6. Creativity (1pt)

__Theme : Winter__

I got winter village's screenshot in minecraft by skybox .
As there is lighthouse 3d object, snowflakes and winter tree plane.
I want to show snowy village in the minecraft because my avatar is steve, which is main character in the game minecraft.

# Challenges

Note: Challenges are _optional_, but you should gather **7 points** from challenges to get the full score at the end of the term project.
For more detailed description, please refer to the term project introduction slides.
Listed challenges are TA-recommended challenges which are helpful for the current assignment and the whole project.

- This is the final assignment. Don't forget to submit your challenge tasks ! You have to earn 7 challenge points to get full score!

- Challenges that have already earned challenge points in previous assignments do not need to be resubmitted.

- This time, some challenge lists overlap with some basic requirements. Please note that the functions that earned basic requirements points is not counted for the challenge points.

## 0. Previous challenge lists

- Assignment #1
    - ~~Keyframe-based 2D animation~~ (1pt)
- Assignment #2
    - ~~Advanced keyframe-based 3D animation~~ ~~(1pt)~~ -> (0.5pt)
    - ~~Arcball~~ (1pt)

- Assignment #3
    - Perlin noise (2pt) (new Implement)
    - ~~Toon shading (1pt)~~

__[Newaly implementation && reimplementation]__

- Arcball (ReImplement)
I reimplement arcball in updateArcball(elapsed) function by using quaternion multiplication refered by paper in klms.

- Perlin noise (2pt) (new Implement)
I implement perlin noise in blinn_phong.frag referring https://en.wikipedia.org/wiki/Perlin_noise.
I made checkbox to turn on perlin noise, slider to resize grid of perlin noise in webpage.

## 1. Fish-eye

I implement Fish-Eye effect and reverse-fish-eye effect by using mapping method. 

Power of fish-eye effect can be controlled in slider in the ottom of webpage, "Fish Eye Power".

## 2. Chromatic aberration

I implement chromatic aberration by mapping color in same pixel's origin texture in different position in real texture.

This power can be controlled in slider in the bottom of webpage, "Chromatic Abertion Power".


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
