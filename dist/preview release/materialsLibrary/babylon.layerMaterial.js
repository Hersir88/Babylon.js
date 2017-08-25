/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var LayerMaterialDefines = (function (_super) {
        __extends(LayerMaterialDefines, _super);
        function LayerMaterialDefines() {
            var _this = _super.call(this) || this;
            _this.DIFFUSE = false;
            _this.DIFFUSEDIRECTUV = 0;
            _this.CLIPPLANE = false;
            _this.ALPHATEST = false;
            _this.POINTSIZE = false;
            _this.FOG = false;
            _this.NORMAL = false;
            _this.UV1 = false;
            _this.UV2 = false;
            _this.VERTEXCOLOR = false;
            _this.VERTEXALPHA = false;
            _this.NUM_BONE_INFLUENCERS = 0;
            _this.BonesPerMesh = 0;
            _this.INSTANCES = false;
            _this.ALPHAFROMDIFFUSE = false;
            _this.BUMP = false;
            _this.BUMPDIRECTUV = 0;
            _this.MAINUV1 = false;
            _this.MAINUV2 = false;
            _this.SPECULARTERM = false;
            _this.rebuild();
            return _this;
        }
        return LayerMaterialDefines;
    }(BABYLON.MaterialDefines));
    var LayerMaterial = (function (_super) {
        __extends(LayerMaterial, _super);
        function LayerMaterial() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.backgroundColor = new BABYLON.Color3(1, 0, 1);
            _this.specularColor = new BABYLON.Color3(1, 1, 1);
            _this.specularPower = 64;
            _this._disableLighting = false;
            _this._maxSimultaneousLights = 4;
            _this._invertNormalMapX = false;
            _this._invertNormalMapY = false;
            return _this;
        }
        LayerMaterial.prototype.needAlphaBlending = function () {
            return this.alpha < 1.0;
        };
        LayerMaterial.prototype.needAlphaTesting = function () {
            return false;
        };
        LayerMaterial.prototype._shouldUseAlphaFromDiffuseTexture = function () {
            return this._diffuseTexture && this.diffuseTexture.hasAlpha;
        };
        LayerMaterial.prototype.getAlphaTestTexture = function () {
            return this._diffuseTexture;
        };
        // Methods   
        LayerMaterial.prototype.isReadyForSubMesh = function (mesh, subMesh, useInstances) {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }
            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new LayerMaterialDefines();
            }
            var defines = subMesh._materialDefines;
            var scene = this.getScene();
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }
            var engine = scene.getEngine();
            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                defines.MAINUV1 = false;
                defines.MAINUV2 = false;
                if (scene.texturesEnabled) {
                    if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReady()) {
                            return false;
                        }
                        else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && BABYLON.StandardMaterial.BumpTextureEnabled) {
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        }
                        else {
                            BABYLON.MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");
                        }
                    }
                    else {
                        defines.BUMP = false;
                    }
                }
                else {
                    defines.DIFFUSE = false;
                    defines.BUMP = false;
                }
                defines.ALPHAFROMDIFFUSE = this._shouldUseAlphaFromDiffuseTexture();
            }
            // Misc.
            BABYLON.MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            // Lights
            defines._needNormals = BABYLON.MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);
            // Values that need to be evaluated on every frame
            BABYLON.MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            // Attribs
            BABYLON.MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();
                // Fallbacks
                var fallbacks = new BABYLON.EffectFallbacks();
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                if (defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
                }
                BABYLON.MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }
                //Attributes
                var attribs = [BABYLON.VertexBuffer.PositionKind];
                if (defines.NORMAL) {
                    attribs.push(BABYLON.VertexBuffer.NormalKind);
                }
                if (defines.UV1) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                }
                if (defines.UV2) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (defines.VERTEXCOLOR) {
                    attribs.push(BABYLON.VertexBuffer.ColorKind);
                }
                BABYLON.MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                BABYLON.MaterialHelper.PrepareAttributesForInstances(attribs, defines);
                var shaderName = "layerMaterial";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vBackgroundColor",
                    "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "vDiffuseInfos", "vBumpInfos", "bumpMatrix",
                    "mBones",
                    "vClipPlane", "diffuseMatrix", "vTangentSpaceParams",
                ];
                var samplers = ["diffuseSampler", "bumpSampler"];
                var uniformBuffers = [];
                BABYLON.MaterialHelper.PrepareUniformsAndSamplersList({
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: this.maxSimultaneousLights
                });
                subMesh.setEffect(scene.getEngine().createEffect(shaderName, {
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights - 1 }
                }, engine), defines);
            }
            if (!subMesh.effect.isReady()) {
                return false;
            }
            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;
            return true;
        };
        LayerMaterial.prototype.bindForSubMesh = function (world, mesh, subMesh) {
            var scene = this.getScene();
            var defines = subMesh._materialDefines;
            if (!defines) {
                return;
            }
            var effect = subMesh.effect;
            this._activeEffect = effect;
            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());
            // Bones
            BABYLON.MaterialHelper.BindBonesParameters(mesh, this._activeEffect);
            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._diffuseTexture && BABYLON.StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);
                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                }
                if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && BABYLON.StandardMaterial.BumpTextureEnabled) {
                    this._activeEffect.setTexture("bumpSampler", this._bumpTexture);
                    this._activeEffect.setMatrix("bumpMatrix", this._bumpTexture.getTextureMatrix());
                    this._activeEffect.setFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, 0.05);
                    if (scene._mirroredCameraPosition) {
                        this._activeEffect.setFloat2("vTangentSpaceParams", this.invertNormalMapX ? 1.0 : -1.0, this.invertNormalMapY ? 1.0 : -1.0);
                    }
                    else {
                        this._activeEffect.setFloat2("vTangentSpaceParams", this.invertNormalMapX ? -1.0 : 1.0, this.invertNormalMapY ? -1.0 : 1.0);
                    }
                }
                // Clip plane
                BABYLON.MaterialHelper.BindClipPlane(this._activeEffect, scene);
                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }
                if (defines.SPECULARTERM) {
                    this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
                }
                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);
            }
            this._activeEffect.setColor4("vBackgroundColor", this.backgroundColor, this.alpha * mesh.visibility);
            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                BABYLON.MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
            }
            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== BABYLON.Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            // Fog
            BABYLON.MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            this._afterBind(mesh, this._activeEffect);
        };
        LayerMaterial.prototype.getAnimatables = function () {
            var results = [];
            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
            }
            if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
                results.push(this._bumpTexture);
            }
            return results;
        };
        LayerMaterial.prototype.getActiveTextures = function () {
            var activeTextures = _super.prototype.getActiveTextures.call(this);
            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            if (this._bumpTexture) {
                activeTextures.push(this._bumpTexture);
            }
            return activeTextures;
        };
        LayerMaterial.prototype.hasTexture = function (texture) {
            if (_super.prototype.hasTexture.call(this, texture)) {
                return true;
            }
            if (this.diffuseTexture === texture) {
                return true;
            }
            if (this._bumpTexture === texture) {
                return true;
            }
            return false;
        };
        LayerMaterial.prototype.dispose = function (forceDisposeEffect) {
            if (this._diffuseTexture) {
                this._diffuseTexture.dispose();
            }
            if (this._bumpTexture) {
                this._bumpTexture.dispose();
            }
            _super.prototype.dispose.call(this, forceDisposeEffect);
        };
        LayerMaterial.prototype.clone = function (name) {
            var _this = this;
            return BABYLON.SerializationHelper.Clone(function () { return new LayerMaterial(name, _this.getScene()); }, this);
        };
        LayerMaterial.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.LayerMaterial";
            return serializationObject;
        };
        LayerMaterial.prototype.getClassName = function () {
            return "LayerMaterial";
        };
        // Statics
        LayerMaterial.Parse = function (source, scene, rootUrl) {
            return BABYLON.SerializationHelper.Parse(function () { return new LayerMaterial(source.name, scene); }, source, scene, rootUrl);
        };
        return LayerMaterial;
    }(BABYLON.PushMaterial));
    __decorate([
        BABYLON.serializeAsTexture("diffuseTexture")
    ], LayerMaterial.prototype, "_diffuseTexture", void 0);
    __decorate([
        BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
    ], LayerMaterial.prototype, "diffuseTexture", void 0);
    __decorate([
        BABYLON.serializeAsColor3("background")
    ], LayerMaterial.prototype, "backgroundColor", void 0);
    __decorate([
        BABYLON.serializeAsTexture("bumpTexture")
    ], LayerMaterial.prototype, "_bumpTexture", void 0);
    __decorate([
        BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty"),
        BABYLON.serializeAsColor3("specular")
    ], LayerMaterial.prototype, "specularColor", void 0);
    __decorate([
        BABYLON.serialize()
    ], LayerMaterial.prototype, "specularPower", void 0);
    __decorate([
        BABYLON.serialize("disableLighting")
    ], LayerMaterial.prototype, "_disableLighting", void 0);
    __decorate([
        BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
    ], LayerMaterial.prototype, "disableLighting", void 0);
    __decorate([
        BABYLON.serialize("maxSimultaneousLights")
    ], LayerMaterial.prototype, "_maxSimultaneousLights", void 0);
    __decorate([
        BABYLON.expandToProperty("_markAllSubMeshesAsLightsDirty")
    ], LayerMaterial.prototype, "maxSimultaneousLights", void 0);
    __decorate([
        BABYLON.serialize("invertNormalMapX")
    ], LayerMaterial.prototype, "_invertNormalMapX", void 0);
    __decorate([
        BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
    ], LayerMaterial.prototype, "invertNormalMapX", void 0);
    __decorate([
        BABYLON.serialize("invertNormalMapY")
    ], LayerMaterial.prototype, "_invertNormalMapY", void 0);
    __decorate([
        BABYLON.expandToProperty("_markAllSubMeshesAsTexturesDirty")
    ], LayerMaterial.prototype, "invertNormalMapY", void 0);
    BABYLON.LayerMaterial = LayerMaterial;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.layerMaterial.js.map

BABYLON.Effect.ShadersStore['layerMaterialVertexShader'] = "precision highp float;\n\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nvNormalW=normalize(vec3(finalWorld*vec4(normalUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}\n";
BABYLON.Effect.ShadersStore['layerMaterialPixelShader'] = "precision highp float;\n\nuniform vec3 vEyePosition;\nuniform vec4 vBackgroundColor;\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vBackgroundColor;\n\nfloat alpha=1.0;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif \nfloat shadow=1.;\n#include<lightFragment>[0..maxSimultaneousLights]\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\nvec3 mixedColor=mix(vBackgroundColor.rgb,baseColor.rgb,alpha);\nvec4 color=vec4(clamp(diffuseBase,0.0,1.0)*mixedColor.rgb+finalSpecular,vBackgroundColor.a);\n#include<fogFragment>\ngl_FragColor=color;\n}";
