﻿precision highp float;

// Constants
uniform vec3 vEyePosition;
uniform vec4 vBackgroundColor;

#if defined(BUMP) || !defined(NORMAL)
#extension GL_OES_standard_derivatives : enable
#endif

#ifdef DIFFUSE
uniform vec2 vDiffuseInfos;
#endif

#ifdef BUMP
uniform vec3 vBumpInfos;
uniform vec2 vTangentSpaceParams;
#endif

#ifdef SPECULARTERM
uniform vec4 vSpecularColor;
#endif
#ifdef MAINUV1
	varying vec2 vMainUV1;
#endif

#ifdef MAINUV2
	varying vec2 vMainUV2;
#endif

// Input
varying vec3 vPositionW;

#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

// Helper functions
#include<helperFunctions>

// Lights
#include<__decl__lightFragment>[0..maxSimultaneousLights]

#include<lightsFragmentFunctions>
#include<shadowsFragmentFunctions>

// Samplers
#ifdef DIFFUSE
	#if DIFFUSEDIRECTUV == 1
		#define vDiffuseUV vMainUV1
	#elif DIFFUSEDIRECTUV == 2
		#define vDiffuseUV vMainUV2
	#else
		varying vec2 vDiffuseUV;
	#endif
	uniform sampler2D diffuseSampler;
#endif

#include<bumpFragmentFunctions>
#include<clipPlaneFragmentDeclaration>

// Fog
#include<fogFragmentDeclaration>

void main(void) {

#include<clipPlaneFragment>

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Base color
	vec4 baseColor = vBackgroundColor;

	// Alpha
	float alpha = 1.0;

	// Normal
#ifdef NORMAL
	vec3 normalW = normalize(vNormalW);
#else
	vec3 normalW = normalize(-cross(dFdx(vPositionW), dFdy(vPositionW)));
#endif
#include<bumpFragment>

#ifdef DIFFUSE
	baseColor = texture2D(diffuseSampler, vDiffuseUV + uvOffset);

#ifdef ALPHATEST
	if (baseColor.a < 0.4)
		discard;
#endif

#ifdef ALPHAFROMDIFFUSE
	alpha *= baseColor.a;
#endif

	baseColor.rgb *= vDiffuseInfos.y;
#endif

#ifdef VERTEXCOLOR
	baseColor.rgb *= vColor.rgb;
#endif

#ifdef SPECULARTERM
	float glossiness = vSpecularColor.a;
	vec3 specularColor = vSpecularColor.rgb;
#else
	float glossiness = 0.;
#endif

	// Lighting
	vec3 diffuseBase = vec3(0., 0., 0.);
    lightingInfo info;
#ifdef SPECULARTERM
	vec3 specularBase = vec3(0., 0., 0.);
#endif 
float shadow = 1.;
#include<lightFragment>[0..maxSimultaneousLights]


#ifdef VERTEXALPHA
	alpha *= vColor.a;
#endif

#ifdef SPECULARTERM
	vec3 finalSpecular = specularBase * specularColor;
#else
	vec3 finalSpecular = vec3(0.0);
#endif

	vec3 mixedColor = mix(vBackgroundColor.rgb, baseColor.rgb, alpha);
	vec4 color = vec4(clamp(diffuseBase, 0.0, 1.0) * mixedColor.rgb + finalSpecular, vBackgroundColor.a);
#include<fogFragment>
	gl_FragColor = color;
}