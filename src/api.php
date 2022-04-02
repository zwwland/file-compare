<?php

require_once '../vendor/autoload.php';
use TencentCloud\Common\Credential;
use TencentCloud\Common\Profile\ClientProfile;
use TencentCloud\Common\Profile\HttpProfile;
use TencentCloud\Common\Exception\TencentCloudSDKException;
use TencentCloud\Ocr\V20181119\OcrClient;
use TencentCloud\Ocr\V20181119\Models\GeneralAccurateOCRRequest;

$dotenv = \Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->load();
$id  = $_ENV['APP_ID'];
$sec = $_ENV['APP_SECRET'];
$s   = $_POST['source'];
$n   = $_POST['new'];
header("Content-Type: application/json; charset=UTF-8");
if(empty($s) || empty($n)){
    echo '{}';
    exit;
}
try {


    $cred = new Credential($id, $sec);
    $httpProfile = new HttpProfile();
    $httpProfile->setEndpoint("ocr.tencentcloudapi.com");
      
    $clientProfile = new ClientProfile();
    $clientProfile->setHttpProfile($httpProfile);
    $client = new OcrClient($cred, "ap-beijing", $clientProfile);

    $req = new GeneralAccurateOCRRequest();
    
    $params = array(
        "ImageBase64" => explode(",", $s)[1],
        "EnableDetectSplit" => true
    );
    $req->fromJsonString(json_encode($params));

    $resp = $client->GeneralAccurateOCR($req);
    $data = [];

    $data['source'] = json_decode($resp->toJsonString(), true);

    $params = array(
        "ImageBase64" => explode(",", $n)[1],
        "EnableDetectSplit" => true
    );
    $req->fromJsonString(json_encode($params));

    $resp = $client->GeneralAccurateOCR($req);
    $data['new'] = json_decode($resp->toJsonString(), true);

    echo json_encode($data);
}
catch(TencentCloudSDKException $e) {
    echo $e;
}