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

    $a = '';
    foreach($data['source']['TextDetections'] as $k => $v){
        $a = $a . $v['DetectedText'] ;
    }
    $b = '';
    foreach($data['new']['TextDetections'] as $k => $v){
        $b = $b . $v['DetectedText'] ;
    }
    $res = http_curl_json('http://stamper.998990.xyz:8086', [
        'a' => $a,
        'b' => $b
    ],'POST');
    $res_decode = json_decode($res, true);
    // file_put_contents('./tmp.png', base64_decode(explode(',',$n)[1]));
    // $s = draw('./tmp.png', $data);

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

  function http_curl_json($uri, $post_data = [],  $method = 'GET', $header = [])
  {
      //初始化
      $ch      = curl_init();
    //   $reqdata = http_build_query($post_data);
    //   $length  = strlen($reqdata);
    $reqdata = json_encode($post_data);
    $length = strlen($reqdata);
      curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
      //异步 1 非异步 0
      curl_setopt($ch, CURLOPT_TIMEOUT, 0);
      if (preg_match('/:(\d+)/', $uri, $port)) {
          $url = str_replace(':' . $port[1], '', $uri);
          $port = $port[1];
      } else {
          $url  = $uri;
          $port = 80;
      }
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_PORT, $port);
      curl_setopt($ch, CURLOPT_HEADER, 0);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
      if (strtoupper($method) == 'POST') {
          curl_setopt($ch, CURLOPT_POST, 1);
        //   curl_setopt($ch, CURLOPT_POSTFIELDS, $reqdata);
          curl_setopt($ch, CURLOPT_POSTFIELDS, $reqdata);
          array_push($header, 'Content-length: ' . $length);
      }
      //    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST,0);
      //    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST,0);
      $default_header = [
          // 'Content-Type: application/x-www-form-urlencoded;charset=utf-8',
          'Content-Type: application/json; charset=utf-8',
          //"Content-Length: {$length}",
          //'X-Requested-With: XMLHttpRequest',
          //'Accept: application/json, text/javascript, */*; q=0.01',
          //'Accept-Encoding: gzip, deflate',
          //'Accept-Language: en-US,en;q=0.9',
          //'Pragma: no-cache',
          'Cache-Control: no-cache',
          //                    'User-Agent: PostmanRuntime/7.15.0',
          'Accept: */*',
          //                    'accept-encoding: gzip,deflate',
      ];
      curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($default_header, $header));
  
      $data = curl_exec($ch);
      // $s = curl_getinfo($ch,CURLINFO_HEADER_OUT);
      if (false === $data) {
          $err = curl_error($ch);
      }
      curl_close($ch);
  
      return $data;
  }
  