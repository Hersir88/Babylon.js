﻿/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class LayerMaterialDefines extends MaterialDefines {
        public DIFFUSE = false;
        public DIFFUSEDIRECTUV = 0;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public POINTSIZE = false;
        public FOG = false;
        public NORMAL = false;
        public UV1 = false;
        public UV2 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;
        public ALPHAFROMDIFFUSE = false;
        public BUMP = false;
        public BUMPDIRECTUV = 0;
        public MAINUV1 = false;
        public MAINUV2 = false;
        public SPECULARTERM = false;

        constructor() {
            super();
            this.rebuild();
        }
    }

    export class LayerMaterial extends PushMaterial {
        @serializeAsTexture("diffuseTexture")
        private _diffuseTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public diffuseTexture: BaseTexture;

        @serializeAsColor3("background")
        public backgroundColor = new Color3(1, 0, 1);

        @serializeAsTexture("bumpTexture")
        private _bumpTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        @serializeAsColor3("specular")
        public specularColor = new Color3(1, 1, 1);

        @serialize()
        public specularPower = 64;
        
        @serialize("disableLighting")
        private _disableLighting = false;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public disableLighting: boolean;   
        
        @serialize("maxSimultaneousLights")
        private _maxSimultaneousLights = 4;
        @expandToProperty("_markAllSubMeshesAsLightsDirty")
        public maxSimultaneousLights: number; 

        @serialize("invertNormalMapX")
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public invertNormalMapX: boolean;

        @serialize("invertNormalMapY")
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public invertNormalMapY: boolean;

        private _renderId: number;

        public needAlphaBlending(): boolean {
            return this.alpha < 1.0;
        }

        public needAlphaTesting(): boolean {
            return false;
        }

        protected _shouldUseAlphaFromDiffuseTexture(): boolean {
            return this._diffuseTexture && this.diffuseTexture.hasAlpha;
        }

        public getAlphaTestTexture(): BaseTexture {
            return this._diffuseTexture;
        }

        // Methods   
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances: boolean = false): boolean {   
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new LayerMaterialDefines();
            }

            var defines = <LayerMaterialDefines>subMesh._materialDefines;
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
                    if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        if (!this._diffuseTexture.isReady()) {
                            return false;
                        } else {
                            defines._needUVs = true;
                            defines.DIFFUSE = true;
                        }
                    }
                    if (scene.getEngine().getCaps().standardDerivatives && this._bumpTexture && StandardMaterial.BumpTextureEnabled) {
                        if (!this._bumpTexture.isReady()) {
                            return false;
                        } else {
                            MaterialHelper.PrepareDefinesForMergedUV(this._bumpTexture, defines, "BUMP");
                        }
                    } else {
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
            MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

            // Lights
            defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);

            // Values that need to be evaluated on every frame
            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            
            // Attribs
            MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);

            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();             
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                if (defines.BUMP) {
                    fallbacks.addFallback(0, "BUMP");
                }

                MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);
                
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (defines.UV2) {
                    attribs.push(VertexBuffer.UV2Kind);
                }

                if (defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, defines);

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
                var uniformBuffers: String[] = [];

                MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                    uniformsNames: uniforms, 
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers, 
                    defines: defines, 
                    maxSimultaneousLights: this.maxSimultaneousLights
                });
                subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                    <EffectCreationOptions>{
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
            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <LayerMaterialDefines>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            if (!effect) {
                return;
            }
            if (!scene.activeCamera) {
                return;
            }
            this._activeEffect = effect;

            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);

                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                }

                if (this._bumpTexture && scene.getEngine().getCaps().standardDerivatives && StandardMaterial.BumpTextureEnabled) {
                    this._activeEffect.setTexture("bumpSampler", this._bumpTexture);
                    this._activeEffect.setMatrix("bumpMatrix", this._bumpTexture.getTextureMatrix());
                    this._activeEffect.setFloat3("vBumpInfos", this._bumpTexture.coordinatesIndex, 1.0 / this._bumpTexture.level, 0.05);
                    if (scene._mirroredCameraPosition) {
                        this._activeEffect.setFloat2("vTangentSpaceParams", this.invertNormalMapX ? 1.0 : -1.0, this.invertNormalMapY ? 1.0 : -1.0);
                    } else {
                        this._activeEffect.setFloat2("vTangentSpaceParams", this.invertNormalMapX ? -1.0 : 1.0, this.invertNormalMapY ? -1.0 : 1.0);
                    }                           
                }
                
                // Clip plane
                MaterialHelper.BindClipPlane(this._activeEffect, scene);

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
                MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);          
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

            this._afterBind(mesh, this._activeEffect);
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
            }
            if (this._bumpTexture && this._bumpTexture.animations && this._bumpTexture.animations.length > 0) {
                results.push(this._bumpTexture);
            }

            return results;
        }

        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }
            if (this._bumpTexture) {
                activeTextures.push(this._bumpTexture);
            }

            return activeTextures;
        }

        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            if (this.diffuseTexture === texture) {
                return true;
            }
            
            if (this._bumpTexture === texture) {
                return true;
            }

            return false;    
        }        

        public dispose(forceDisposeEffect?: boolean): void {
            if (this._diffuseTexture) {
                this._diffuseTexture.dispose();
            }
            if (this._bumpTexture) {
                this._bumpTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): LayerMaterial {
            return SerializationHelper.Clone<LayerMaterial>(() => new LayerMaterial(name, this.getScene()), this);
        }
        
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.LayerMaterial";
            return serializationObject;
        }

        public getClassName(): string {
            return "LayerMaterial";
        }               
        
        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): LayerMaterial {
            return SerializationHelper.Parse(() => new LayerMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
} 

