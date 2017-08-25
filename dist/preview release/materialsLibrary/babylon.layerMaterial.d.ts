
declare module BABYLON {
    class LayerMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        backgroundColor: Color3;
        private _bumpTexture;
        specularColor: Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _invertNormalMapX;
        invertNormalMapX: boolean;
        private _invertNormalMapY;
        invertNormalMapY: boolean;
        private _renderId;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        protected _shouldUseAlphaFromDiffuseTexture(): boolean;
        getAlphaTestTexture(): BaseTexture;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): LayerMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): LayerMaterial;
    }
}
