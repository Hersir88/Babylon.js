precision highp float;

// Uniforms
uniform mat4 viewProjection;
uniform mat4 view;

#ifdef DIFFUSE
uniform mat4 diffuseMatrix;
uniform vec2 vDiffuseInfos;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

#ifdef POINTSIZE
	uniform float pointSize;
#endif


// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif
#ifdef TANGENT
attribute vec4 tangent;
#endif
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif
#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

// Uniforms
#include<instancesDeclaration>

#ifdef MAINUV1
	varying vec2 vMainUV1;
#endif

#ifdef MAINUV2
	varying vec2 vMainUV2;
#endif

#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0
varying vec2 vDiffuseUV;
#endif

#if defined(BUMP) && BUMPDIRECTUV == 0
varying vec2 vBumpUV;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<bumpVertexDeclaration>

#include<clipPlaneVertexDeclaration>

#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

#include<logDepthDeclaration>

void main(void) {
	vec3 positionUpdated = position;
#ifdef NORMAL	
	vec3 normalUpdated = normal;
#endif
#ifdef TANGENT
	vec4 tangentUpdated = tangent;
#endif

#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

#include<instancesVertex>
#include<bonesVertex>

	gl_Position = viewProjection * finalWorld * vec4(positionUpdated, 1.0);

	vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);
	vPositionW = vec3(worldPos);

#ifdef NORMAL
	vNormalW = normalize(vec3(finalWorld * vec4(normalUpdated, 0.0)));
#endif

	// Texture coordinates
#ifndef UV1
	vec2 uv = vec2(0., 0.);
#endif
#ifndef UV2
	vec2 uv2 = vec2(0., 0.);
#endif

#ifdef MAINUV1
	vMainUV1 = uv;
#endif

#ifdef MAINUV2
	vMainUV2 = uv2;
#endif

#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0
	if (vDiffuseInfos.x == 0.)
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#if defined(BUMP) && BUMPDIRECTUV == 0
	if (vBumpInfos.x == 0.)
	{
		vBumpUV = vec2(bumpMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#include<bumpVertex>
#include<clipPlaneVertex>
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

#ifdef VERTEXCOLOR
	vColor = color;
#endif

#include<pointCloudVertex>
#include<logDepthVertex>
}
