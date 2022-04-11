      import aligner from './out.js'
      !(function () {
        const files = document.querySelectorAll(".files input");
        files.forEach((f, i) => {
          f.addEventListener("change", function () {
            const f = this.files[0];
            const reader = new FileReader();
            const url = reader.readAsDataURL(f);
            reader.addEventListener("loadend", function () {
              const images = document.querySelectorAll(".images img");
              images[i].src = this.result;
              // if (images.forEach(g => g.src.length > 0) == -1)
              // {
              //     console.log("all images loaded")
              // }
              let count = 0;
              for (const im of images) {
                if (im.src.length > 0) {
                  count++;
                }
              }
              if (count == 2) {
                console.log("all images loaded");
                let formData = new FormData();
                formData.append("source", images[0].src);
                formData.append("new", images[1].src);
                fetch("/api.php", { method: "POST", body: formData })
                  .then((res) => res.json())
                  .then((res) => {
                    document.querySelector(".item-source").src = res.s
                    document.querySelector('.item-new').src = res.n

                    // let source = []
                    // if(res.source.TextDetections.length > 0)
                    // {
                    //   const basicSourceDiff = (res.source.TextDetections[0].Polygon[0].Y - res.source.TextDetections[0].Polygon[0].Y) ** 2
                    //   let basicSourceLastY = res.source.TextDetections[0].Polygon[0].Y

                    //   for(const text of res.source.TextDetections)
                    //   {
                    //     let diff = (text.Polygon[0].Y - basicSourceLastY - basicSourceDiff) ** 2
                    //     if (diff < 26)
                    //     {
                    //       if(source.length == 0)
                    //       {
                    //         source.push(text)
                    //       }else{
                    //         source[source.length - 1 ].DetectedText += text.DetectedText
                    //         source[source.length - 1 ].ItemPolygon.Width += text.ItemPolygon.Width
                    //         // source[source.length - 1 ].ItemPolygon.Height += text.ItemPolygon.Height
                    //         source[source.length - 1 ].WordCoordPoint.push(...text.WordCoordPoint)
                    //         source[source.length - 1 ].Words.push(...text.Words)
                    //       }
                    //     }else{
                    //       source.push(text)
                    //     }
                    //       basicSourceLastY = text.Polygon[0].Y
                    //   }
                    // }
                    // let ne = []
                    // if(res.new.TextDetections.length > 0)
                    // {
                    //   const basicNewDiff = (res.new.TextDetections[0].Polygon[0].Y - res.new.TextDetections[0].Polygon[0].Y) ** 2
                    //   let basicNewLastY = res.new.TextDetections[0].Polygon[0].Y

                    //   for(const text of res.new.TextDetections)
                    //   {
                    //     let diff = (text.Polygon[0].Y - basicNewLastY - basicNewDiff) ** 2
                    //     if (diff < 26) {
                    //       if(ne.length == 0)
                    //       {
                    //         ne.push(text)
                    //       }else{
                    //         ne[ne.length - 1 ].DetectedText += text.DetectedText
                    //         ne[ne.length - 1 ].ItemPolygon.Width += text.ItemPolygon.Width
                    //         // ne[ne.length - 1 ].ItemPolygon.Height += text.ItemPolygon.Height
                    //         ne[ne.length - 1 ].WordCoordPoint.push(...text.WordCoordPoint)
                    //         ne[ne.length - 1 ].Words.push(...text.Words)
                    //       }
                    //     }else{
                    //       ne.push(text)
                    //     }
                    //     basicNewLastY = text.Polygon[0].Y
                    //   }
                    // }
                    // const s = source.map(
                    //   (item) => item.DetectedText.replace(/[\s\,「」\-\="'，。\.；;、\\/ ：:()（）\[\]【】 “” > < 》 《]/g, "")
                    // ).join("✌");
                    // const n = ne.map(
                    //   (item) => item.DetectedText.replace(/[\s\,「」\-\="'，。\.；;、\\/ ：:()（）\[\]【】 “” > < 》 《]/g, "")
                    // ).join("✌");
                    // console.log(s,n,source,ne)
                    // let al = aligner.NWaligner({
                    //   gapSymbol: "⭐"
                    // })
                    // // let start = (new Date()).getTime();
                    // let r = al.align(s,n)
                    // // let start1 = (new Date()).getTime();
                    // let ssequence = r.alignedSequences[0].split("")
                    // let nsequence = r.alignedSequences[1].split("")
                    // for(let i=0; i < ssequence.length; i++) {
                    //   if(ssequence[i] == "⭐" && nsequence[i] == "⭐") {
                    //     nsequence[i] = ""
                    //   }
                    //   if(ssequence[i] != '⭐' && nsequence[i] == '⭐') {
                    //     nsequence[i] = `<span style="border:1px solid red;">${ssequence[i]}</span>`
                    //   }
                    //   if(ssequence[i] == '⭐' && nsequence[i] != '⭐') {
                    //     nsequence[i] = `<span style="border:1px solid green">${nsequence[i]}</span>`
                    //   }
                    // }
                    // // let start2 = (new Date()).getTime();
                    // document.querySelector(".item-new").innerHTML =  nsequence.join('').replace(/✌/g, "<br />");
                    // document.querySelector(".item-source").innerHTML = s.replace(/✌/g, "<br>");
                    // // let start3 = (new Date()).getTime();
                    // // console.log(start3-start2, start2-start1, start1 - start);
                    // var sourceFragment = document.createDocumentFragment();
                    // sourceFragment.appendChild(document.createTextNode(s));
                  }).catch(err=> console.log(err));
              }
              reader.removeEventListener("loadend", this);
            });
          });
        });
        console.log(files);
      })();
      // fetch('api.php').then(res=>res.text()).then(data=>{
      //     console.log(data);
      // })