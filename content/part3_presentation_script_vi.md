# Script thuyết trình phần 3 — Kết quả và đánh giá

Bám theo bản hiện tại: slide 23–31. Lời nói chính khoảng 10–13 phút, tùy thời gian giải thích metric và baseline. Các ví dụ giả định dưới đây chỉ để giải thích, không phải kết quả thực nghiệm.

## Slide 23 — Fair Evaluation Across Controllers

“Sau khi trình bày cách huấn luyện, em chuyển sang câu hỏi: chính sách học được có điều phối xe hiệu quả hơn những cách điều khiển đơn giản hay không?

Nhóm so sánh ba mô hình RL là MLP10, GRU10 và Belief20-fade với ba bộ điều khiển theo luật: Fixed, Proportional và Threshold. Ba mô hình RL khác nhau ở cách biểu diễn thông tin đầu vào; các baseline dùng quy tắc viết sẵn, không học tham số từ reward.

Mỗi cấu hình RL được huấn luyện với ba seed 11, 22 và 33, mỗi seed sử dụng 245.760 transitions. Seed tạo ra những lần huấn luyện có yếu tố ngẫu nhiên khác nhau, giúp kiểm tra kết quả có phụ thuộc quá nhiều vào một lần chạy hay không.

Checkpoint được chọn theo cost thấp nhất trên 100 ngày validation. Sau đó mô hình được đánh giá trên 200 ngày mô phỏng cho mỗi điều kiện: Normal, nhu cầu tăng đột biến và gián đoạn giao thông. Ngày ở đây là một episode mô phỏng, không phải ngày triển khai ngoài thực tế. Một episode dài 240 phút, trong đó 180 phút đầu có khách mới và 60 phút cuối dành để xử lý nhu cầu còn lại.

Các bộ điều khiển được thử trên cùng các kịch bản đánh giá. Nhờ vậy, khi so sánh, khác biệt không đơn giản là do một phương pháp gặp ngày ít khách hơn.”

### Giải thích baseline khi nói ở slide này

“Baseline là phương pháp đối chứng. Nếu chỉ báo cáo RL có cost bao nhiêu thì chưa biết con số đó tốt đến đâu. Baseline cho biết với cùng môi trường và tài nguyên, các quy tắc điều phối đơn giản đạt được kết quả như thế nào.”

**Fixed:** “Trong code, Fixed luôn trả về action 0, tức NOOP. Điều này có nghĩa là giữ kế hoạch vận hành hiện tại. Xe vẫn chạy theo cơ chế lịch và điều phối sẵn có của simulator, chứ không phải tất cả xe đứng yên. Fixed không chủ động điều chỉnh headway hay tái phân bổ xe theo biến động nhu cầu.”

**Proportional:** “Bộ điều khiển này phân bổ xe theo tỷ trọng khách đến quan sát được trong lịch sử gần đây. Mỗi tuyến được giữ tối thiểu hai xe. Nếu tổng hàng chờ dưới 120 người, ngân sách mục tiêu là chín xe; từ 120 người trở lên, ngân sách là 12 xe. Phần xe còn lại sau mức tối thiểu được chia theo tỷ trọng nhu cầu, làm tròn sao cho tổng số xe đúng ngân sách.

Ví dụ, với ngân sách 12 xe và tỷ trọng nhu cầu 50%, 30%, 20%, sau khi giữ hai xe cho mỗi tuyến còn sáu xe để chia. Quy tắc làm tròn trong code cho phân bổ mục tiêu là 5, 4, 3 xe. Bộ điều khiển ưu tiên đưa xe dự phòng đến tuyến thiếu, rồi chuyển xe từ tuyến dư, thu hồi xe dư và điều chỉnh headway. Headway là khoảng thời gian giữa hai lần xuất phát; mục tiêu được chọn gần nhất trong các mức 6, 10, 15 phút.”

**Threshold:** “Bộ điều khiển này ưu tiên tuyến có độ khẩn cấp cao nhất. Độ khẩn cấp kết hợp số khách đang chờ so với số xe đã cam kết, tuổi chờ lớn nhất và khoảng cách xuất phát. Khi tuyến được ưu tiên có ít nhất 40 khách chờ, nó tìm cách tăng phục vụ bằng short-turn, xe dự phòng hoặc chuyển xe từ tuyến khác, tùy điều kiện hợp lệ.

Nếu tỷ lệ khách ước tính phù hợp với chuyến quay đầu ngắn đạt ít nhất 70%, short-turn có thể được ưu tiên. Đây là ước tính từ hàng chờ và phân bố điểm đến giả định, không phải biết chính xác điểm đến tương lai của mọi khách.

Nếu chưa chọn được hành động tăng xe, quy tắc thử headway 6 phút khi hàng chờ từ 80 người, 10 phút khi từ 40 đến dưới 80, và 15 phút khi dưới 40. Khi hàng chờ dưới năm người, nó có thể thử thu hồi xe, sau bước thử chỉnh headway. Mỗi lần quyết định chỉ trả về một hành động và phải kiểm tra action mask.”

**Câu chốt:** “Fixed giữ kế hoạch; Proportional cân đối theo tỷ trọng nhu cầu; Threshold phản ứng theo độ khẩn cấp. RL học cách cân đối tác động hiện tại và tác động về sau thông qua reward.”

## Slide 24 — One Objective, Multiple Service Metrics

“Nhóm sử dụng Total Cost làm chỉ số chính, nhưng đồng thời theo dõi thời gian chờ và trạng thái phục vụ hành khách. Lý do là một bộ điều khiển có cost thấp nhất chưa chắc tốt nhất trên từng khía cạnh dịch vụ.”

### Total Cost — thấp hơn tốt hơn

“Total Cost là tổng điểm phạt của hệ thống trong một ca, không phải chi phí tính bằng tiền. Nó tổng hợp thời gian chờ, thời gian trên xe, đông đúc, thời gian xe hoạt động, chạy rỗng, chờ quá lâu, không lên được xe, bỏ chờ, thay đổi nhiệm vụ và hành khách chưa hoàn tất khi hết ca.”


“Ví dụ, gọi thêm xe có thể giảm chờ nhưng tăng thời gian xe hoạt động và chạy rỗng. Vì thế tối ưu cost là cân bằng nhiều thành phần. Reward liên hệ với cost qua dấu âm và hệ số chuẩn hóa 3.000. Con số cost 13.065,7 trên slide là điểm cost tổng hợp được báo cáo, không phải 13.065,7 đồng và không phải reward đã chia 3.000.”

### Mean Wait — thấp hơn tốt hơn, đơn vị phút

“Mean Wait là thời gian chờ quan sát trung bình của hành khách trong một ngày mô phỏng. Với người đã lên xe, thời gian chờ kết thúc lúc lên xe. Với người bỏ chờ, nó kết thúc lúc bỏ chờ. Với người vẫn đang chờ khi hết ca, báo cáo tính thời gian từ lúc đến đến lúc hết ca.

Ví dụ ba người có thời gian chờ 2, 4 và 9 phút thì Mean Wait là 5 phút. Chỉ số này mô tả trải nghiệm trung bình nhưng có thể che khuất một nhóm nhỏ phải chờ rất lâu. Nó không phải tổng thời gian hành trình vì không cộng thời gian ở trên xe.”

Lưu ý: người vẫn đang chờ có thời gian chờ bị cắt tại cuối episode; đây chưa phải thời gian chờ cuối cùng nếu tiếp tục mô phỏng.

### P95 Wait — thấp hơn tốt hơn, đơn vị phút

“P95 là phân vị 95% của thời gian chờ. Trong một ngày có P95 bằng 11 phút, khoảng 95% hành khách có thời gian chờ không vượt mức đó, còn khoảng 5% nằm ở phía chờ lâu hơn. Đây không phải thời gian chờ lớn nhất, cũng không phải trung bình của 5% chờ lâu nhất.

Trong báo cáo này, trước tiên tính P95 riêng cho từng ngày, rồi lấy trung bình các P95 ngày. Vì vậy, khi slide ghi 11,28 phút, em diễn giải là P95 theo ngày trung bình bằng 11,28 phút. Không khẳng định chính xác 95% toàn bộ hành khách gộp từ 200 ngày chờ dưới con số này.”

### Completion, Abandonment và Unfinished

“Cả ba tỷ lệ đều lấy tổng số khách được sinh ra trong episode làm mẫu số.

Completion là số người đã đến đích chia tổng khách. Người chỉ vừa lên xe chưa được tính hoàn tất. Abandonment là số người bỏ chờ chia tổng khách; trong mô hình, ngưỡng bỏ chờ là 45 phút. Unfinished là số người vẫn đang chờ hoặc đang ở trên xe khi hết ca chia tổng khách.

Ví dụ sinh ra 1.000 khách, có 970 người đến đích, 20 người bỏ chờ và 10 người chưa hoàn tất: Completion là 97%, Abandonment là 2%, Unfinished là 1%. Ba trạng thái cuối này cộng lại bằng 100% trong một episode có khách, bỏ qua sai số làm tròn khi trình bày.”

“Completion 100% không có nghĩa là không ai phải chờ; nó có nghĩa tất cả khách đã hoàn tất trước khi ca kết thúc.”

### Đọc Mean ± Seed SD và 95% CI

“Mean ± Seed SD thể hiện mức cost trung bình và độ lệch chuẩn giữa ba seed huấn luyện. Ví dụ 13.065,7 ± 52,4 nghĩa là cost trung bình là 13.065,7 và độ lệch chuẩn giữa seed là 52,4; không phải cam kết mọi ngày đều nằm trong khoảng cộng trừ đó.

Khoảng tin cậy 95% của chênh lệch được ước lượng bằng bootstrap các ngày đánh giá ghép cặp. Nếu khoảng chênh lệch cost nằm hoàn toàn trên 0, dữ liệu ủng hộ phương pháp đang xét có cost cao hơn phương pháp tham chiếu. Nếu khoảng đi qua 0, chưa kết luận chắc chiều khác biệt từ phép so sánh đó. Không đọc 95% CI thành khoảng chứa 95% hành khách hay 95% ngày.”

## Slide 25 — Encoder / Normal

“Ở điều kiện Normal, RL-MLP10 có Total Cost trung bình thấp nhất là 13.065,7. So với Fixed, cost giảm khoảng 17,6%.

Không chỉ cost giảm: Mean Wait giảm từ 7,42 xuống 5,57 phút, tức khoảng 1,85 phút; P95 Wait giảm từ 14,88 xuống 11,28 phút, khoảng 3,60 phút. Completion đạt 100%.

Như vậy trong điều kiện bình thường, kết quả cho thấy lợi ích đồng thời trên mục tiêu tổng hợp và các chỉ số chờ này. Tuy nhiên, Belief20-fade cũng đạt Mean Wait 5,57 và P95 11,28 ở độ chính xác đang hiển thị, nên MLP10 có cost thấp nhất không có nghĩa chỉ riêng nó có thời gian chờ tốt nhất.”

Cách tính giảm cost: `(Cost baseline − Cost RL) / Cost baseline × 100%`. Ví dụ so Fixed: `(15.861,3 − 13.065,7) / 15.861,3 ≈ 17,6%`.

## Slide 26 — Encoder / Demand Burst

“Demand Burst kiểm tra khi nhu cầu tăng đột biến. Trong điều kiện này, Belief20-fade có cost trung bình thấp nhất là 25.178,5. Mức giảm khoảng 25,4% so với Fixed, 10,0% so với Proportional và 5,1% so với Threshold.

Nhưng nếu chỉ nhìn cost sẽ bỏ sót một đánh đổi. Threshold có P95 Wait 26,64 phút, thấp hơn 30,87 phút của Belief; Completion của Threshold là 98,59%, cao hơn 98,21%; Abandonment là 0,90%, thấp hơn 1,79%.

Vì vậy, ở tình huống quá tải, Threshold tốt hơn trên ba chỉ số dịch vụ vừa nêu, còn Belief tốt hơn trên cost tổng hợp. Điều này không mâu thuẫn vì cost còn tính các thành phần vận hành và trải nghiệm khác, với trọng số cụ thể. Chưa phân rã cost thì không khẳng định chính xác thành phần nào tạo ra chênh lệch.

Kết luận của slide là: phương pháp có tổng cost thấp nhất chưa chắc phục vụ tốt nhất trên mọi metric. Nếu triển khai với yêu cầu cứng về chờ lâu hoặc bỏ chờ, cần xem các chỉ số đó bên cạnh cost.”

## Slide 27 — Encoder / Traffic

“Trong điều kiện gián đoạn giao thông, MLP10 tiếp tục có cost trung bình thấp nhất, đạt 13.412,4. Mean Wait là 5,70 phút, P95 Wait là 11,79 phút và Completion là 100%.

Cost giảm 17,8% so với Fixed, 19,0% so với Proportional và 20,8% so với Threshold. Kết quả này cho thấy lợi ích điều phối vẫn xuất hiện trong kịch bản giao thông bị nhiễu đã thử nghiệm. Đây là kết quả trong simulator, chưa đủ để suy rộng thành khả năng xử lý mọi tình huống giao thông ngoài thực tế.”

## Slide 28 — Encoder / Summary

“Bảng này tổng hợp ba encoder theo cost trung bình và độ lệch chuẩn giữa seed. MLP10 có cost trung bình thấp nhất ở Normal và Traffic; Belief20-fade thấp nhất ở Burst. GRU10 không có cost trung bình thấp nhất trong ba điều kiện.

Một số chênh lệch khá nhỏ. Ví dụ Normal, MLP10 và Belief chỉ khác khoảng 15,9 điểm cost. Bảng mean và SD này chưa cung cấp phép so sánh CI trực tiếp giữa từng cặp encoder. Vì thế em kết luận về thứ hạng trung bình quan sát được, không khẳng định MLP luôn vượt trội có ý nghĩa thống kê.

Thông điệp là biểu diễn phức tạp hơn chưa chắc cho kết quả tốt hơn trong thiết lập này; cũng chưa có một encoder tốt nhất cho mọi điều kiện.”

## Slide 29 — Mask vs No Mask

“Thí nghiệm tiếp theo giữ encoder GRU10 để so sánh các thuật toán và vai trò của action mask. Đây là nhóm chạy huấn luyện lại riêng, nên không trộn trực tiếp số của slide này với bảng encoder trước.

Trong Normal, PPO có mask đạt cost 13.172,7; REINFORCE là 13.870,1 và A2C là 14.152,6. Trong các cấu hình được báo cáo, PPO có mask có cost trung bình thấp nhất.

Để xét tác dụng của mask, ta so sánh PPO có mask với PPO không mask. Mask loại các hành động không hợp lệ khỏi phân phối chọn action. Ví dụ một xe không đủ điều kiện chuyển tuyến sẽ không được chọn để REASSIGN. Ở chế độ không mask trong repo, yêu cầu không hợp lệ được thực thi thành NOOP, chứ không phá bỏ các ràng buộc vật lý.

PPO có mask giảm cost 12,24% trong Normal, 15,92% trong Burst và 12,62% trong Traffic. Như vậy tác dụng giảm cost xuất hiện ở cả ba điều kiện đã thử.

Các phương pháp có cùng ngân sách transitions nhưng không có cùng số bước tối ưu: PPO tái sử dụng rollout qua nhiều minibatch và epoch, còn REINFORCE và A2C có cơ chế cập nhật khác. Vì vậy đây là so sánh những cấu hình huấn luyện cụ thể, chưa chứng minh ưu thế tuyệt đối trong mọi ngân sách tính toán.”

Ghi chú nếu được hỏi: Burst PPO có mask đạt 25.209,4 so với 29.983,1 không mask. CI mức giảm 15,92% là [15,04%; 16,84%], dựa trên ngày ghép cặp và không bao gồm toàn bộ bất định do seed huấn luyện.

## Slide 30 — Available Action

“Ablation nghĩa là bỏ từng thành phần khỏi hệ thống để xem nó đóng góp gì. Ở đây, core là cấu hình tham chiếu đầy đủ, không phải baseline theo luật.

Bỏ REASSIGN nghĩa là không cho chuyển xe giữa các tuyến bằng hành động đó. Bỏ SHORT_TURN nghĩa là không cho quay đầu sớm để phục vụ một đoạn tuyến. Hai hành động giúp hệ thống có thêm cách phân phối năng lực phục vụ.

Trong cả ba điều kiện, bỏ một trong hai hành động đều làm cost trung bình tăng. Ví dụ Normal, bỏ REASSIGN tăng 0,47%, CI từ 0,33% đến 0,60%; bỏ SHORT_TURN tăng 1,65%, CI từ 1,51% đến 1,77%. Các khoảng đều trên 0, ủng hộ đóng góp của hai hành động trong thiết lập này.

Biểu đồ còn có No Fairness. Đây là bỏ trọng số phạt chờ lâu khỏi mục tiêu huấn luyện, không phải bỏ một action. Khi đánh giá, các cấu hình vẫn được chấm bằng cost chuẩn để có cùng thước đo. Trong Burst, CI của No Fairness đi từ −0,44% đến 2,41%, qua 0, nên chưa kết luận chắc hiệu ứng của riêng thành phần đó trong Burst.

Biểu đồ phóng đại phần đỉnh cột và mỗi điều kiện có khoảng trục riêng. Vì vậy cần đọc giá trị và trục, không so chiều cao cột trực tiếp giữa các ô.”

## Slide 31 — What Did We Learn?

“Em tổng kết năm điểm. Thứ nhất, mô hình RL tốt nhất có Total Cost thấp hơn các baseline theo luật ở cả ba điều kiện đã thử. Thứ hai, không có encoder thắng mọi trường hợp: MLP10 thấp nhất ở Normal và Traffic, Belief thấp nhất ở Burst.

Thứ ba, action masking giúp PPO giảm cost nhất quán trong cả ba điều kiện. Thứ tư, REASSIGN và SHORT_TURN đều đóng góp: bỏ từng hành động làm cost trung bình tăng. Thứ năm, cost thấp nhất không bảo đảm tất cả chỉ số dịch vụ đều tốt nhất, thể hiện rõ ở Burst.

Phạm vi kết luận là mạng xe buýt tổng hợp và các kịch bản đã đánh giá. Kết quả cho thấy tiềm năng của điều phối học từ trải nghiệm, đồng thời cho thấy cần theo dõi cả mục tiêu tổng hợp lẫn chất lượng phục vụ hành khách.”

## Câu hỏi thường gặp và trả lời ngắn

**Baseline có phải mạng neural đơn giản hơn?** Không. Ba baseline trong phần này là luật viết sẵn; MLP10 dù đơn giản hơn GRU vẫn thuộc nhóm RL.

**Baseline và baseline trong REINFORCE có giống nhau?** Không. Ở phần đánh giá, baseline là bộ điều khiển đối chứng. Trong policy gradient, baseline là mốc kỳ vọng, thường liên quan value, dùng để giảm phương sai của ước lượng gradient.

**Vì sao Fixed trả NOOP mà xe vẫn chạy?** NOOP giữ kế hoạch điều phối hiện tại; simulator vẫn tiến thời gian và vận hành xe theo kế hoạch đó.

**Vì sao Mean Wait thấp mà P95 cao?** Phần lớn người có thể chờ ít nhưng một nhóm nhỏ chờ rất lâu. Mean mô tả trung bình; P95 theo dõi vùng đuôi phân phối.

**Abandonment và Unfinished có cộng trùng không?** Không ở trạng thái cuối episode: người đã bỏ chờ thuộc abandoned; unfinished chỉ gồm người còn chờ hoặc còn trên xe.

**100 ngày validation và 200 ngày test có phải dữ liệu đường phố?** Không. Đây là các ngày/episode mô phỏng tổng hợp, dùng để chọn checkpoint và đánh giá trên tập giữ riêng.

**Vì sao ba seed?** Để quan sát biến động giữa các lần huấn luyện. Ba seed vẫn là số lượng nhỏ; SD không thay thế mọi phân tích bất định.

## Nguồn đối chiếu trong repo

- `slides.js`: phần 3 hiện tại, slide 23–31, gồm số liệu và notes.
- `../src/bus_rl/learning/baselines/fixed.py`, `proportional.py`, `threshold.py`: luật điều khiển thực tế.
- `../src/bus_rl/evaluation/summary.py`: cách tính wait, P95, completion, abandonment, unfinished và cost đánh giá chuẩn.
- `../src/bus_sim/oracle/costs.py`: định nghĩa các trọng số cost và công thức tổng hợp.
- `../reports/README.md`, `../reports/tables/ablations.csv`: kết quả đối chứng, ablation và giới hạn suy luận.
- `../configs/base.toml`: thời gian episode và cấu hình mạng.
