import"./chunk-WHOZS5DZ.js";import"./chunk-4UWLMZGK.js";import"./chunk-BQPQ6TSI.js";import{a as e}from"./chunk-L3UYHT7M.js";import"./chunk-YVY7FGQB.js";var r="hdrIrradianceFilteringPixelShader",i=`#include<helperFunctions>
#include<importanceSampling>
#include<pbrBRDFFunctions>
#include<hdrFilteringFunctions>
uniform samplerCube inputTexture;
#ifdef IBL_CDF_FILTERING
uniform sampler2D icdfTexture;
#endif
uniform vec2 vFilteringInfo;uniform float hdrScale;varying vec3 direction;void main() {vec3 color=irradiance(inputTexture,direction,vFilteringInfo,0.0,vec3(1.0),direction
#ifdef IBL_CDF_FILTERING
,icdfTexture
#endif
);gl_FragColor=vec4(color*hdrScale,1.0);}`;e.ShadersStore[r]||(e.ShadersStore[r]=i);var a={name:r,shader:i};export{a as hdrIrradianceFilteringPixelShader};
