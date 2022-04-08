<?php

require_once '../vendor/autoload.php';
use TencentCloud\Common\Credential;
use TencentCloud\Common\Profile\ClientProfile;
use TencentCloud\Common\Profile\HttpProfile;
use TencentCloud\Common\Exception\TencentCloudSDKException;
use TencentCloud\Ocr\V20181119\OcrClient;
use TencentCloud\Ocr\V20181119\Models\GeneralAccurateOCRRequest;
use TencentCloud\Ocr\V20181119\Models\GeneralHandwritingOCRRequest;

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
    // $req = new GeneralHandwritingOCRRequest();
    
    $params = array(
        "ImageBase64" => explode(",", $s)[1],
        //手写体
        // "EnableWordPolygon "=> true,
        "EnableDetectSplit" => true,
        "IsWords"=> true
    );
    $req->fromJsonString(json_encode($params));

    $resp = $client->GeneralAccurateOCR($req);
    // $resp = $client->GeneralHandwritingOCR($req);
    $data = [];

    $data['source'] = json_decode($resp->toJsonString(), true);

    $params = array(
        "ImageBase64" => explode(",", $n)[1],
        "EnableDetectSplit" => true,
        "IsWords"=> true
    );
    $req->fromJsonString(json_encode($params));

    // $resp = $client->GeneralHandwritingOCR($req);
    $resp = $client->GeneralAccurateOCR($req);
    $data['new'] = json_decode($resp->toJsonString(), true);

    file_put_contents('./tmp.png', base64_decode(explode(',',$n)[1]));

    $s = draw('./tmp.png', $data);

    echo json_encode($data);
}catch(TencentCloudSDKException $e) {
    echo $e;
}


function draw($imagePos, $data)
{
    
    return '';
    
}

function send_post($url, $post_data) {
  

    $options = array(
  
      'http' => array(
  
        'method' => 'POST',
  
        'header' => 'Content-type:application/json',
  
        'content' => json_encode($post_data),
  
        'timeout' => 15 * 60 // 超时时间（单位:s）
  
      )
  
    );
  
    $context = stream_context_create($options);
  
    $result = file_get_contents($url, false, $context);
  
     
    return $result;
  
  }